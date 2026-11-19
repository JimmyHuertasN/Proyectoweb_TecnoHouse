using System.Data.Common;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Options;
using Npgsql;
using NpgsqlTypes;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;
using TecnoHouse.Api.Services;

namespace TecnoHouse.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/pagos")]
public sealed class PagosController(
    TecnoHouseDbContext db,
    WompiService wompi,
    IOptions<WompiOptions> options,
    ILogger<PagosController> logger) : ControllerBase
{
    private const string NombreSavepoint = "iniciar_pago_wompi";
    private readonly WompiOptions _options = options.Value;

    [HttpGet("estado/{idPedido:guid}")]
    [ProducesResponseType<EstadoPagoPedidoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorPagoResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorPagoResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorPagoResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EstadoPagoPedidoResponse>> Estado(
        Guid idPedido,
        CancellationToken cancellationToken)
    {
            var subject = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var usuarioId))
            return Unauthorized(new ErrorPagoResponse("El token no contiene un usuario válido."));

        var transaccion = db.Database.CurrentTransaction;
        if (transaccion is null)
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorPagoResponse("No se pudo consultar el estado del pago."));

        try
        {
            var pago = await LeerUltimoPago(idPedido, usuarioId, transaccion.GetDbTransaction(), cancellationToken);
            return pago is null
                ? NotFound(new ErrorPagoResponse("No se encontró un pago para este pedido."))
                : Ok(pago);
        }
        catch (DbException)
        {
            logger.LogError("No se pudo consultar el estado del pago para el pedido {PedidoId}.", idPedido);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorPagoResponse("No se pudo consultar el estado del pago."));
        }
    }

    [HttpPost("wompi/iniciar/{idPedido:guid}")]
    [ProducesResponseType<IniciarPagoWompiResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorPagoResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorPagoResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorPagoResponse>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ErrorPagoResponse>(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType<ErrorPagoResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IniciarPagoWompiResponse>> Iniciar(
        Guid idPedido,
        CancellationToken cancellationToken)
    {
        var subject = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var usuarioId))
            return Unauthorized(new ErrorPagoResponse("El token no contiene un usuario válido."));

        var transaccion = db.Database.CurrentTransaction;
        if (transaccion is null)
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorPagoResponse("No se pudo iniciar el pago."));

        try
        {
            var pedido = await LeerPedido(idPedido, usuarioId, transaccion.GetDbTransaction(), cancellationToken);
            if (pedido is null)
                return NotFound(new ErrorPagoResponse("No se encontró el pedido."));

            if (string.IsNullOrWhiteSpace(pedido.DireccionEntrega)
                || string.IsNullOrWhiteSpace(pedido.CiudadEntrega)
                || string.IsNullOrWhiteSpace(pedido.DepartamentoEntrega)
                || string.IsNullOrWhiteSpace(pedido.PaisEntrega)
                || string.IsNullOrWhiteSpace(pedido.TelefonoReceptor))
            {
                return UnprocessableEntity(new ErrorPagoResponse(
                    "El pedido no tiene completos los datos de entrega requeridos para iniciar el pago."));
            }

            if (await TienePagoAprobado(idPedido, transaccion.GetDbTransaction(), cancellationToken))
                return Conflict(new ErrorPagoResponse("El pedido ya tiene un pago aprobado."));

            if (!string.Equals(pedido.Estado, "pendiente", StringComparison.OrdinalIgnoreCase))
                return Conflict(new ErrorPagoResponse("El estado actual del pedido no permite iniciar el pago."));

            if (pedido.Total <= 0)
                return UnprocessableEntity(new ErrorPagoResponse("El total del pedido debe ser mayor que cero."));

            long montoEnCentavos;
            try
            {
                montoEnCentavos = wompi.ConvertirMontoACentavos(pedido.Total);
            }
            catch (OverflowException)
            {
                return UnprocessableEntity(new ErrorPagoResponse("El total del pedido no es válido para Wompi."));
            }

            if (montoEnCentavos <= 0)
                return UnprocessableEntity(new ErrorPagoResponse("El total del pedido debe ser mayor que cero centavos."));

            var referencia = wompi.GenerarReferenciaIntento(idPedido);
            var firma = wompi.CrearFirmaIntegridadParaIntento(referencia, montoEnCentavos);
            var redirectUrl = $"{_options.ResultPageBaseUrl.TrimEnd('/')}/{idPedido:D}";

            await transaccion.CreateSavepointAsync(NombreSavepoint, cancellationToken);
            try
            {
                await RegistrarIntento(idPedido, referencia, montoEnCentavos,
                    transaccion.GetDbTransaction(), cancellationToken);
                await transaccion.ReleaseSavepointAsync(NombreSavepoint, cancellationToken);
            }
            catch (PostgresException errorSql)
            {
                await transaccion.RollbackToSavepointAsync(NombreSavepoint, cancellationToken);
                await transaccion.ReleaseSavepointAsync(NombreSavepoint, cancellationToken);

                if (errorSql.SqlState == "P1001")
                    return NotFound(new ErrorPagoResponse("No se encontró el pedido."));
                if (errorSql.SqlState == "P1002")
                    return Conflict(new ErrorPagoResponse("El pedido ya tiene un pago aprobado."));
                if (errorSql.SqlState == "P1003")
                    return Conflict(new ErrorPagoResponse("El estado actual del pedido no permite iniciar el pago."));
                if (errorSql.SqlState == "P1004")
                    return Conflict(new ErrorPagoResponse("El total del pedido cambió o no permite iniciar el pago."));

                logger.LogError("No se pudo guardar el intento de pago Wompi para el pedido {PedidoId}.", idPedido);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ErrorPagoResponse("No se pudo guardar el intento de pago. Intenta nuevamente."));
            }
            catch (DbException)
            {
                await transaccion.RollbackToSavepointAsync(NombreSavepoint, cancellationToken);
                await transaccion.ReleaseSavepointAsync(NombreSavepoint, cancellationToken);
                logger.LogError("No se pudo guardar el intento de pago Wompi para el pedido {PedidoId}.", idPedido);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ErrorPagoResponse("No se pudo guardar el intento de pago. Intenta nuevamente."));
            }

            var correo = User.FindFirstValue("email") ?? User.FindFirstValue(ClaimTypes.Email);
            var telefonoCliente = NormalizarTelefono(pedido.TelefonoPerfil ?? pedido.TelefonoCliente);
            var telefonoReceptor = NormalizarTelefono(pedido.TelefonoReceptor);
            var respuesta = new IniciarPagoWompiResponse(
                _options.PublicKey,
                "COP",
                montoEnCentavos,
                referencia,
                firma.Firma,
                redirectUrl,
                new DatosClienteWompiResponse(
                    string.IsNullOrWhiteSpace(correo) ? null : correo,
                    pedido.NombrePerfil ?? pedido.NombreCliente,
                    telefonoCliente,
                    "+57"),
                new DireccionEnvioWompiResponse(
                    pedido.DireccionEntrega,
                    pedido.CiudadEntrega,
                    pedido.DepartamentoEntrega,
                    pedido.PaisEntrega,
                    telefonoReceptor,
                    pedido.NombreCliente),
                firma.ExpirationTime);

            return Ok(respuesta);
        }
        catch (DbException)
        {
            logger.LogError("No se pudo consultar o iniciar el pago Wompi para el pedido {PedidoId}.", idPedido);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorPagoResponse("No se pudo iniciar el pago. Intenta nuevamente."));
        }
    }

    private static async Task<PedidoParaPago?> LeerPedido(
        Guid pedidoId,
        Guid usuarioId,
        DbTransaction transaccion,
        CancellationToken cancellationToken)
    {
        await using var comando = transaccion.Connection!.CreateCommand();
        comando.Transaction = transaccion;
        comando.CommandText = """
            select
                p.total,
                p.estado,
                p.cliente_nombre,
                p.cliente_telefono,
                p.direccion_entrega,
                p.ciudad_entrega,
                p.departamento_entrega,
                p.pais_entrega,
                p.telefono_receptor,
                coalesce(nullif(perfil.nombre, ''), p.cliente_nombre),
                coalesce(nullif(perfil.telefono, ''), p.cliente_telefono)
            from public.pedidos as p
            left join public.perfiles as perfil on perfil.id = p.usuario_id
            where p.id = @pedido_id
              and p.usuario_id = @usuario_id
            limit 1;
            """;
        comando.Parameters.Add(new NpgsqlParameter("pedido_id", NpgsqlDbType.Uuid) { Value = pedidoId });
        comando.Parameters.Add(new NpgsqlParameter("usuario_id", NpgsqlDbType.Uuid) { Value = usuarioId });

        await using var lector = await comando.ExecuteReaderAsync(cancellationToken);
        if (!await lector.ReadAsync(cancellationToken))
            return null;

        return new PedidoParaPago(
            lector.GetDecimal(0),
            lector.GetString(1),
            lector.GetString(2),
            lector.GetString(3),
            TextoONull(lector, 4),
            TextoONull(lector, 5),
            TextoONull(lector, 6),
            TextoONull(lector, 7),
            TextoONull(lector, 8),
            TextoONull(lector, 9),
            TextoONull(lector, 10));
    }

    private static async Task<EstadoPagoPedidoResponse?> LeerUltimoPago(
        Guid pedidoId,
        Guid usuarioId,
        DbTransaction transaccion,
        CancellationToken cancellationToken)
    {
        await using var comando = transaccion.Connection!.CreateCommand();
        comando.Transaction = transaccion;
        comando.CommandText = """
            select pa.estado::text, pa.referencia, pa.monto_centavos, pa.metodo_pago
            from public.pedidos as p
            join lateral (
                select pago.estado, pago.referencia, pago.monto_centavos, pago.metodo_pago
                from public.pagos as pago
                where pago.pedido_id = p.id
                -- Si el pedido tiene un pago aprobado se muestra ese; si no, el intento más reciente.
                order by (pago.estado = 'APPROVED'::public.estado_pago) desc, pago.creado_en desc, pago.id desc
                limit 1
            ) as pa on true
            where p.id = @pedido_id
              and p.usuario_id = @usuario_id
            limit 1;
            """;
        comando.Parameters.Add(new NpgsqlParameter("pedido_id", NpgsqlDbType.Uuid) { Value = pedidoId });
        comando.Parameters.Add(new NpgsqlParameter("usuario_id", NpgsqlDbType.Uuid) { Value = usuarioId });

        await using var lector = await comando.ExecuteReaderAsync(cancellationToken);
        return await lector.ReadAsync(cancellationToken)
            ? new EstadoPagoPedidoResponse(
                lector.GetString(0),
                lector.GetString(1),
                lector.GetInt64(2),
                lector.IsDBNull(3) ? null : lector.GetString(3))
            : null;
    }

    private static async Task<bool> TienePagoAprobado(
        Guid pedidoId,
        DbTransaction transaccion,
        CancellationToken cancellationToken)
    {
        await using var comando = transaccion.Connection!.CreateCommand();
        comando.Transaction = transaccion;
        comando.CommandText = """
            select exists (
                select 1
                from public.pagos
                where pedido_id = @pedido_id
                  and estado = 'APPROVED'::public.estado_pago
            );
            """;
        comando.Parameters.Add(new NpgsqlParameter("pedido_id", NpgsqlDbType.Uuid) { Value = pedidoId });
        return (bool)(await comando.ExecuteScalarAsync(cancellationToken) ?? false);
    }

    private static async Task RegistrarIntento(
        Guid pedidoId,
        string referencia,
        long montoEnCentavos,
        DbTransaction transaccion,
        CancellationToken cancellationToken)
    {
        await using var comando = transaccion.Connection!.CreateCommand();
        comando.Transaction = transaccion;
        comando.CommandText = "select public.registrar_pago_wompi_pedido(@pedido_id, @referencia, @monto_centavos);";
        comando.Parameters.Add(new NpgsqlParameter("pedido_id", NpgsqlDbType.Uuid) { Value = pedidoId });
        comando.Parameters.Add(new NpgsqlParameter("referencia", NpgsqlDbType.Text) { Value = referencia });
        comando.Parameters.Add(new NpgsqlParameter("monto_centavos", NpgsqlDbType.Bigint) { Value = montoEnCentavos });
        await comando.ExecuteScalarAsync(cancellationToken);
    }

    private static string? TextoONull(DbDataReader lector, int ordinal) =>
        lector.IsDBNull(ordinal) ? null : lector.GetString(ordinal);

    private static string NormalizarTelefono(string telefono)
    {
        var digitos = new string(telefono.Where(char.IsDigit).ToArray());
        return digitos.Length == 12 && digitos.StartsWith("57", StringComparison.Ordinal)
            ? digitos[2..]
            : digitos;
    }

    private sealed record PedidoParaPago(
        decimal Total,
        string Estado,
        string NombreCliente,
        string TelefonoCliente,
        string? DireccionEntrega,
        string? CiudadEntrega,
        string? DepartamentoEntrega,
        string? PaisEntrega,
        string? TelefonoReceptor,
        string? NombrePerfil,
        string? TelefonoPerfil);
}
