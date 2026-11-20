using System.Data.Common;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using NpgsqlTypes;
using TecnoHouse.Api.Clients;
using TecnoHouse.Api.Data;

namespace TecnoHouse.Api.Services;

public enum ResultadoEventoWompi
{
    Aplicado,
    SinCambios,
    Duplicado,
    ReferenciaDesconocida,
    MontoNoCoincide,
    TransaccionDistinta,
}

public sealed record EventoTransaccionWompi(
    string TransaccionId,
    string Referencia,
    string Estado,
    long MontoEnCentavos,
    string? MetodoPago,
    string? Mensaje,
    string Checksum);

public sealed class WompiEventoProcesador(TecnoHouseDbContext db, ILogger<WompiEventoProcesador> logger)
{
    public const string EventoTransaccion = "transaction.updated";

    private static readonly string[] PropiedadesFirmadasObligatorias =
        ["transaction.id", "transaction.status", "transaction.amount_in_cents"];

    private static readonly HashSet<string> EstadosFinales = ["APPROVED", "DECLINED", "VOIDED", "ERROR"];

    public static string? LeerNombreEvento(string json)
    {
        try
        {
            using var documento = JsonDocument.Parse(json);
            return documento.RootElement.ValueKind == JsonValueKind.Object
                && documento.RootElement.TryGetProperty("event", out var nombre)
                && nombre.ValueKind == JsonValueKind.String
                    ? nombre.GetString()
                    : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    // El checksum solo protege las propiedades listadas en signature.properties; por eso se exige
    // que cubran id, estado y monto, que son los datos con los que se decide el pago.
    public static EventoTransaccionWompi? LeerTransaccion(string json)
    {
        try
        {
            using var documento = JsonDocument.Parse(json);
            var raiz = documento.RootElement;
            if (!raiz.TryGetProperty("signature", out var firma)
                || !firma.TryGetProperty("properties", out var propiedades)
                || propiedades.ValueKind != JsonValueKind.Array
                || !firma.TryGetProperty("checksum", out var checksum)
                || checksum.ValueKind != JsonValueKind.String
                || !raiz.TryGetProperty("data", out var datos)
                || !datos.TryGetProperty("transaction", out var transaccion)
                || transaccion.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            var firmadas = propiedades.EnumerateArray()
                .Where(p => p.ValueKind == JsonValueKind.String)
                .Select(p => p.GetString()!)
                .ToHashSet(StringComparer.Ordinal);
            if (!PropiedadesFirmadasObligatorias.All(firmadas.Contains))
                return null;

            var id = Texto(transaccion, "id");
            var referencia = Texto(transaccion, "reference");
            var estado = Texto(transaccion, "status")?.ToUpperInvariant();
            if (id is null || referencia is null || estado is null
                || !transaccion.TryGetProperty("amount_in_cents", out var monto)
                || !monto.TryGetInt64(out var montoEnCentavos))
            {
                return null;
            }

            return new EventoTransaccionWompi(
                id,
                referencia,
                estado,
                montoEnCentavos,
                Texto(transaccion, "payment_method_type"),
                Texto(transaccion, "status_message"),
                checksum.GetString()!.ToLowerInvariant());
        }
        catch (JsonException)
        {
            return null;
        }
    }

    // Todo ocurre en una transacción: el evento se registra por checksum, el pago se bloquea y solo
    // pasa de PENDING a un estado final una vez. El trigger pagos_confirma_pedido descuenta el
    // inventario únicamente en esa transición, así que repetir el evento no vuelve a descontar.
    public async Task<ResultadoEventoWompi> ProcesarAsync(
        EventoTransaccionWompi evento,
        string cuerpoJson,
        CancellationToken cancellationToken)
    {
        await using var transaccion = await db.Database.BeginTransactionAsync(cancellationToken);
        var dbTransaccion = transaccion.GetDbTransaction();

        var eventoId = await RegistrarEvento(evento, cuerpoJson, dbTransaccion, cancellationToken);
        if (eventoId is null)
        {
            await transaccion.CommitAsync(cancellationToken);
            return ResultadoEventoWompi.Duplicado;
        }

        var resultado = await AplicarAlPago(evento, eventoId.Value, dbTransaccion, cancellationToken);
        await transaccion.CommitAsync(cancellationToken);
        return resultado;
    }

    // Devuelve null si ese mismo evento ya fue procesado; si llegó antes pero falló, lo reintenta.
    private static async Task<long?> RegistrarEvento(
        EventoTransaccionWompi evento,
        string cuerpoJson,
        DbTransaction transaccion,
        CancellationToken cancellationToken)
    {
        await using var insertar = Comando(transaccion, """
            insert into public.wompi_eventos (evento, wompi_transaction_id, referencia, checksum, payload)
            values (@evento, @transaccion_id, @referencia, @checksum, @payload)
            on conflict (checksum) do nothing
            returning id;
            """);
        insertar.Parameters.Add(new NpgsqlParameter("evento", NpgsqlDbType.Text) { Value = EventoTransaccion });
        insertar.Parameters.Add(new NpgsqlParameter("transaccion_id", NpgsqlDbType.Text) { Value = evento.TransaccionId });
        insertar.Parameters.Add(new NpgsqlParameter("referencia", NpgsqlDbType.Text) { Value = evento.Referencia });
        insertar.Parameters.Add(new NpgsqlParameter("checksum", NpgsqlDbType.Text) { Value = evento.Checksum });
        insertar.Parameters.Add(new NpgsqlParameter("payload", NpgsqlDbType.Jsonb) { Value = cuerpoJson });

        if (await insertar.ExecuteScalarAsync(cancellationToken) is long nuevo)
            return nuevo;

        await using var existente = Comando(transaccion, """
            select id, procesado
            from public.wompi_eventos
            where checksum = @checksum
            for update;
            """);
        existente.Parameters.Add(new NpgsqlParameter("checksum", NpgsqlDbType.Text) { Value = evento.Checksum });
        await using var lector = await existente.ExecuteReaderAsync(cancellationToken);
        if (!await lector.ReadAsync(cancellationToken) || lector.GetBoolean(1))
            return null;

        return lector.GetInt64(0);
    }

    // Respaldo del webhook: aplica el estado que Wompi devolvió al consultar la transacción,
    // con exactamente las mismas reglas (monto, PENDING -> final una sola vez, trigger de inventario).
    public async Task<ResultadoEventoWompi> ProcesarTransaccionConsultadaAsync(
        WompiTransaction transaccionWompi,
        CancellationToken cancellationToken)
    {
        var evento = new EventoTransaccionWompi(
            transaccionWompi.Id,
            transaccionWompi.Reference,
            transaccionWompi.Status.ToString().ToUpperInvariant(),
            transaccionWompi.AmountInCents,
            transaccionWompi.PaymentMethodType,
            null,
            "");

        await using var transaccion = await db.Database.BeginTransactionAsync(cancellationToken);
        var resultado = await AplicarAlPago(evento, null, transaccion.GetDbTransaction(), cancellationToken);
        await transaccion.CommitAsync(cancellationToken);
        return resultado;
    }

    public async Task<IReadOnlyList<string>> ListarReferenciasPendientesAsync(
        int minutosMinimos,
        int intervaloReconsultaMinutos,
        int limite,
        CancellationToken cancellationToken)
    {
        await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var comando = db.Database.GetDbConnection().CreateCommand();
            comando.CommandText = """
                with candidatos as materialized (
                    select id, referencia, creado_en, wompi_ultima_consulta_en
                    from public.pagos
                    where estado = 'PENDING'::public.estado_pago
                      and proveedor = 'wompi'
                      and creado_en < now() - make_interval(mins => @minutos_minimos)
                      and (
                          wompi_ultima_consulta_en is null
                          or wompi_ultima_consulta_en <= now() - make_interval(mins => @intervalo_reconsulta)
                      )
                    order by wompi_ultima_consulta_en asc nulls first, creado_en, id
                    limit @limite
                    for update skip locked
                ), numerados as (
                    select id, referencia,
                           row_number() over (
                               order by wompi_ultima_consulta_en asc nulls first, creado_en, id
                           ) as orden
                    from candidatos
                ), marcados as (
                    update public.pagos as pago
                    set wompi_ultima_consulta_en = statement_timestamp()
                        + ((numerados.orden - 1)::double precision * interval '1 microsecond')
                    from numerados
                    where pago.id = numerados.id
                    returning pago.id
                )
                select numerados.referencia
                from numerados
                join marcados using (id)
                order by numerados.orden;
                """;
            comando.Parameters.Add(new NpgsqlParameter("minutos_minimos", NpgsqlDbType.Integer) { Value = minutosMinimos });
            comando.Parameters.Add(new NpgsqlParameter("intervalo_reconsulta", NpgsqlDbType.Integer) { Value = intervaloReconsultaMinutos });
            comando.Parameters.Add(new NpgsqlParameter("limite", NpgsqlDbType.Integer) { Value = limite });

            var referencias = new List<string>();
            await using var lector = await comando.ExecuteReaderAsync(cancellationToken);
            while (await lector.ReadAsync(cancellationToken))
                referencias.Add(lector.GetString(0));
            return referencias;
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    private async Task<ResultadoEventoWompi> AplicarAlPago(
        EventoTransaccionWompi evento,
        long? eventoId,
        DbTransaction transaccion,
        CancellationToken cancellationToken)
    {
        Guid pagoId;
        long montoGuardado;
        string estadoGuardado;
        string? transaccionGuardada;

        await using (var leer = Comando(transaccion, """
            select id, monto_centavos, estado::text, wompi_transaction_id
            from public.pagos
            where referencia = @referencia
            for update;
            """))
        {
            leer.Parameters.Add(new NpgsqlParameter("referencia", NpgsqlDbType.Text) { Value = evento.Referencia });
            await using var lector = await leer.ExecuteReaderAsync(cancellationToken);
            if (!await lector.ReadAsync(cancellationToken))
            {
                await lector.CloseAsync();
                logger.LogWarning("Evento Wompi {EventoId} con referencia desconocida.", eventoId);
                await CerrarEvento(eventoId, "referencia_desconocida", transaccion, cancellationToken);
                return ResultadoEventoWompi.ReferenciaDesconocida;
            }

            pagoId = lector.GetGuid(0);
            montoGuardado = lector.GetInt64(1);
            estadoGuardado = lector.GetString(2);
            transaccionGuardada = lector.IsDBNull(3) ? null : lector.GetString(3);
        }

        if (montoGuardado != evento.MontoEnCentavos)
        {
            logger.LogWarning(
                "ALERTA: el monto del evento Wompi {EventoId} no coincide con el pago {PagoId}.", eventoId, pagoId);
            await CerrarEvento(eventoId, "monto_no_coincide", transaccion, cancellationToken);
            return ResultadoEventoWompi.MontoNoCoincide;
        }

        if (transaccionGuardada is not null && transaccionGuardada != evento.TransaccionId)
        {
            logger.LogWarning(
                "ALERTA: el evento Wompi {EventoId} trae otra transacción para el pago {PagoId}.", eventoId, pagoId);
            await CerrarEvento(eventoId, "transaccion_distinta", transaccion, cancellationToken);
            return ResultadoEventoWompi.TransaccionDistinta;
        }

        if (estadoGuardado != "PENDING" || !EstadosFinales.Contains(evento.Estado))
        {
            await CerrarEvento(eventoId, null, transaccion, cancellationToken);
            return ResultadoEventoWompi.SinCambios;
        }

        await using (var actualizar = Comando(transaccion, """
            update public.pagos
            set estado = @estado::public.estado_pago,
                wompi_transaction_id = @transaccion_id,
                metodo_pago = coalesce(@metodo, metodo_pago),
                mensaje_estado = coalesce(@mensaje, mensaje_estado),
                finalizado_en = now()
            where id = @id
              and estado = 'PENDING'::public.estado_pago;
            """))
        {
            actualizar.Parameters.Add(new NpgsqlParameter("estado", NpgsqlDbType.Text) { Value = evento.Estado });
            actualizar.Parameters.Add(new NpgsqlParameter("transaccion_id", NpgsqlDbType.Text) { Value = evento.TransaccionId });
            actualizar.Parameters.Add(new NpgsqlParameter("metodo", NpgsqlDbType.Text) { Value = (object?)evento.MetodoPago ?? DBNull.Value });
            actualizar.Parameters.Add(new NpgsqlParameter("mensaje", NpgsqlDbType.Text) { Value = (object?)evento.Mensaje ?? DBNull.Value });
            actualizar.Parameters.Add(new NpgsqlParameter("id", NpgsqlDbType.Uuid) { Value = pagoId });
            if (await actualizar.ExecuteNonQueryAsync(cancellationToken) != 1)
            {
                await CerrarEvento(eventoId, null, transaccion, cancellationToken);
                return ResultadoEventoWompi.SinCambios;
            }
        }

        await CerrarEvento(eventoId, null, transaccion, cancellationToken);
        logger.LogInformation("Pago {PagoId} actualizado a {Estado} por el evento {EventoId}.", pagoId, evento.Estado, eventoId);
        return ResultadoEventoWompi.Aplicado;
    }

    private static async Task CerrarEvento(
        long? eventoId,
        string? error,
        DbTransaction transaccion,
        CancellationToken cancellationToken)
    {
        if (eventoId is null)
            return;

        await using var comando = Comando(transaccion, """
            update public.wompi_eventos
            set procesado = true, error = @error
            where id = @id;
            """);
        comando.Parameters.Add(new NpgsqlParameter("error", NpgsqlDbType.Text) { Value = (object?)error ?? DBNull.Value });
        comando.Parameters.Add(new NpgsqlParameter("id", NpgsqlDbType.Bigint) { Value = eventoId });
        await comando.ExecuteNonQueryAsync(cancellationToken);
    }

    private static DbCommand Comando(DbTransaction transaccion, string sql)
    {
        var comando = transaccion.Connection!.CreateCommand();
        comando.Transaction = transaccion;
        comando.CommandText = sql;
        return comando;
    }

    private static string? Texto(JsonElement objeto, string propiedad) =>
        objeto.TryGetProperty(propiedad, out var valor) && valor.ValueKind == JsonValueKind.String
            ? valor.GetString()
            : null;
}
