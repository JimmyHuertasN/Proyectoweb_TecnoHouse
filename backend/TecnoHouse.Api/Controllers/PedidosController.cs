using System.Data;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using NpgsqlTypes;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/pedidos")]
public sealed class PedidosController(TecnoHouseDbContext db) : ControllerBase
{
    private const int MaximoPorProducto = 1000;
    private const int MaximoPorPagina = 100;
    private static readonly JsonSerializerOptions OpcionesJson = new() { PropertyNameCaseInsensitive = true };

    [HttpPost]
    [ProducesResponseType<CrearPedidoResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CrearPedidoResponse>> Crear(
        [FromBody] CrearPedidoRequest request,
        CancellationToken cancellationToken)
    {
        var subject = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var usuarioId))
            return Unauthorized(new { error = "El token no contiene un usuario válido." });

        var entrega = request.Entrega!;
        var direccion = entrega.Direccion?.Trim() ?? "";
        var ciudad = entrega.Ciudad?.Trim() ?? "";
        var departamento = entrega.Departamento?.Trim() ?? "";
        var pais = string.IsNullOrWhiteSpace(entrega.Pais) ? "CO" : entrega.Pais.Trim().ToUpperInvariant();
        var telefonoReceptor = entrega.TelefonoReceptor?.Trim() ?? "";

        if (direccion.Length == 0 || ciudad.Length == 0 || departamento.Length == 0)
            return BadRequest(new { error = "La dirección, ciudad y departamento de entrega son obligatorios." });
        if (telefonoReceptor.Length is < 7 or > 20)
            return BadRequest(new { error = "El teléfono de quien recibe debe tener entre 7 y 20 caracteres." });

        var cantidades = new Dictionary<Guid, int>();
        foreach (var linea in request.Productos)
        {
            if (linea is null || !Guid.TryParse(linea.Id, out var productoId) || productoId == Guid.Empty)
                return BadRequest(new { error = "Cada producto debe tener un id válido." });

            if (linea.Cantidad is not > 0 or > MaximoPorProducto)
                return BadRequest(new { error = $"La cantidad del producto {productoId} debe ser un entero entre 1 y {MaximoPorProducto}." });

            cantidades.TryGetValue(productoId, out var cantidadAcumulada);
            var nuevaCantidad = (long)cantidadAcumulada + linea.Cantidad.Value;
            if (nuevaCantidad > MaximoPorProducto)
                return BadRequest(new { error = $"La cantidad acumulada del producto {productoId} no puede superar {MaximoPorProducto}." });

            cantidades[productoId] = (int)nuevaCantidad;
        }

        var perfil = await db.Perfiles
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == usuarioId, cancellationToken);

        if (perfil is null)
            return BadRequest(new { error = "Completa tu nombre en el perfil antes de crear un pedido." });

        var nombreCliente = perfil.Nombre.Trim();
        if (string.IsNullOrWhiteSpace(nombreCliente) || nombreCliente.Length is < 2 or > 120)
            return BadRequest(new { error = "Completa tu nombre en el perfil antes de crear un pedido." });

        // La vista contiene solo productos activos y está disponible para el rol autenticado.
        var ids = cantidades.Keys.ToArray();
        var productosActivos = await db.ProductosActivos
            .AsNoTracking()
            .Where(x => x.Id.HasValue && ids.Contains(x.Id.Value))
            .Select(x => new { x.Id, x.Nombre, x.Stock })
            .ToListAsync(cancellationToken);
        var productosPorId = productosActivos
            .Where(x => x.Id.HasValue)
            .ToDictionary(x => x.Id!.Value);

        foreach (var (productoId, cantidad) in cantidades)
        {
            if (!productosPorId.TryGetValue(productoId, out var producto))
                return NotFound(new { error = $"El producto {productoId} no existe o no está activo." });

            if (producto.Stock is null || cantidad > producto.Stock.Value)
                return Conflict(new { error = $"No hay stock suficiente de {producto.Nombre ?? "ese producto"}." });
        }

        // crear_pedido también comprueba actividad y stock dentro de la transacción,
        // para cubrir cambios que ocurran entre esta validación y la escritura.
        var itemsJson = JsonSerializer.Serialize(cantidades.Select(x => new
        {
            producto_id = x.Key,
            cantidad = x.Value,
        }));
        var telefonoCliente = TelefonoValido(perfil.Telefono)
            ? perfil.Telefono!.Trim()
            : telefonoReceptor;

        var jsonResultado = await EjecutarCrearPedido(
            nombreCliente,
            telefonoCliente,
            itemsJson,
            direccion,
            ciudad,
            departamento,
            pais,
            telefonoReceptor,
            cancellationToken);

        using var documento = JsonDocument.Parse(jsonResultado);
        var raiz = documento.RootElement;
        var respuesta = new CrearPedidoResponse(
            raiz.GetProperty("id").GetGuid(),
            raiz.GetProperty("numero").GetInt64(),
            raiz.GetProperty("total").GetDecimal(),
            "pendiente",
            null);

        return StatusCode(StatusCodes.Status201Created, respuesta);
    }

    [HttpGet("mis-pedidos")]
    [ProducesResponseType<PaginaPedidosResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginaPedidosResponse>> MisPedidos(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
            return BadRequest(new { error = "page debe ser mayor o igual a 1." });
        if (pageSize is < 1 or > MaximoPorPagina)
            return BadRequest(new { error = $"pageSize debe estar entre 1 y {MaximoPorPagina}." });

        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized(new { error = "El token no contiene un usuario válido." });

        const string sql = """
            with rol as materialized (
                select public.rol_actual()::text as nombre
            ), pedidos_visibles as materialized (
                select p.id, p.numero, p.creado_en, p.total, p.estado
                from public.pedidos p
                cross join rol r
                where r.nombre = 'admin' or p.usuario_id = @usuario_id
            ), pagina as (
                select *
                from pedidos_visibles
                order by creado_en desc, id desc
                offset @offset
                limit @page_size
            )
            select jsonb_build_object(
                'items', coalesce((
                    select jsonb_agg(
                        jsonb_build_object(
                            'pedidoId', p.id,
                            'numero', p.numero,
                            'creadoEn', p.creado_en,
                            'total', p.total,
                            'estadoPedido', p.estado,
                            'estadoPago', (
                                select pa.estado::text
                                from public.pagos pa
                                where pa.pedido_id = p.id
                                order by pa.creado_en desc, pa.id desc
                                limit 1
                            )
                        )
                        order by p.creado_en desc, p.id desc
                    )
                    from pagina p
                ), '[]'::jsonb),
                'total', (select count(*) from pedidos_visibles)
            )::text;
            """;

        var offset = (long)(page - 1) * pageSize;
        var json = await EjecutarConsultaJson(
            sql,
            cancellationToken,
            new NpgsqlParameter("usuario_id", NpgsqlDbType.Uuid) { Value = usuarioId },
            new NpgsqlParameter("offset", NpgsqlDbType.Bigint) { Value = offset },
            new NpgsqlParameter("page_size", NpgsqlDbType.Integer) { Value = pageSize });

        using var documento = JsonDocument.Parse(json ?? "{}");
        var raiz = documento.RootElement;
        var items = JsonSerializer.Deserialize<List<PedidoResumenResponse>>(
            raiz.GetProperty("items").GetRawText(), OpcionesJson) ?? [];
        var total = raiz.GetProperty("total").GetInt64();
        var totalPages = total == 0 ? 0 : (int)((total + pageSize - 1) / pageSize);

        return Ok(new PaginaPedidosResponse(items, page, pageSize, total, totalPages));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<PedidoDetalleResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PedidoDetalleResponse>> ObtenerDetalle(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized(new { error = "El token no contiene un usuario válido." });

        const string sql = """
            select jsonb_build_object(
                'pedidoId', p.id,
                'numero', p.numero,
                'creadoEn', p.creado_en,
                'entrega', jsonb_build_object(
                    'direccion', p.direccion_entrega,
                    'ciudad', p.ciudad_entrega,
                    'departamento', p.departamento_entrega,
                    'pais', p.pais_entrega,
                    'telefonoReceptor', p.telefono_receptor
                ),
                'productos', coalesce((
                    select jsonb_agg(
                        jsonb_build_object(
                            'nombre', i.producto_nombre,
                            'cantidad', i.cantidad,
                            'precioUnitario', i.precio_unitario
                        ) order by i.id
                    )
                    from public.pedido_items i
                    where i.pedido_id = p.id
                ), '[]'::jsonb),
                'total', p.total,
                'estadoPedido', p.estado,
                'estadoPago', (
                    select pa.estado::text
                    from public.pagos pa
                    where pa.pedido_id = p.id
                    order by pa.creado_en desc, pa.id desc
                    limit 1
                )
            )::text
            from public.pedidos p
            cross join (select public.rol_actual()::text as nombre) rol
            where p.id = @pedido_id
              and (rol.nombre = 'admin' or p.usuario_id = @usuario_id)
            limit 1;
            """;

        var json = await EjecutarConsultaJson(
            sql,
            cancellationToken,
            new NpgsqlParameter("pedido_id", NpgsqlDbType.Uuid) { Value = id },
            new NpgsqlParameter("usuario_id", NpgsqlDbType.Uuid) { Value = usuarioId });

        if (json is null)
            return NotFound(new { error = "No se encontró el pedido." });

        var respuesta = JsonSerializer.Deserialize<PedidoDetalleResponse>(json, OpcionesJson);
        return respuesta is null
            ? NotFound(new { error = "No se encontró el pedido." })
            : Ok(respuesta);
    }

    private async Task<string> EjecutarCrearPedido(
        string nombre,
        string telefono,
        string itemsJson,
        string direccion,
        string ciudad,
        string departamento,
        string pais,
        string telefonoReceptor,
        CancellationToken cancellationToken)
    {
        var conexion = db.Database.GetDbConnection();
        var abrirConexion = conexion.State != ConnectionState.Open;
        if (abrirConexion)
            await db.Database.OpenConnectionAsync(cancellationToken);

        try
        {
            await using var comando = conexion.CreateCommand();
            comando.Transaction = db.Database.CurrentTransaction?.GetDbTransaction();
            comando.CommandText = """
                select public.crear_pedido(
                    @p_nombre,
                    @p_telefono,
                    @p_notas,
                    @p_items,
                    @p_direccion_entrega,
                    @p_ciudad_entrega,
                    @p_departamento_entrega,
                    @p_pais_entrega,
                    @p_telefono_receptor
                )::text;
                """;

            comando.Parameters.Add(new NpgsqlParameter("p_nombre", NpgsqlDbType.Text) { Value = nombre });
            comando.Parameters.Add(new NpgsqlParameter("p_telefono", NpgsqlDbType.Text) { Value = telefono });
            comando.Parameters.Add(new NpgsqlParameter("p_notas", NpgsqlDbType.Text) { Value = "" });
            comando.Parameters.Add(new NpgsqlParameter("p_items", NpgsqlDbType.Jsonb) { Value = itemsJson });
            comando.Parameters.Add(new NpgsqlParameter("p_direccion_entrega", NpgsqlDbType.Text) { Value = direccion });
            comando.Parameters.Add(new NpgsqlParameter("p_ciudad_entrega", NpgsqlDbType.Text) { Value = ciudad });
            comando.Parameters.Add(new NpgsqlParameter("p_departamento_entrega", NpgsqlDbType.Text) { Value = departamento });
            comando.Parameters.Add(new NpgsqlParameter("p_pais_entrega", NpgsqlDbType.Text) { Value = pais });
            comando.Parameters.Add(new NpgsqlParameter("p_telefono_receptor", NpgsqlDbType.Text) { Value = telefonoReceptor });

            var resultado = await comando.ExecuteScalarAsync(cancellationToken);
            return resultado as string
                ?? throw new InvalidOperationException("Supabase no devolvió el resultado del pedido.");
        }
        finally
        {
            if (abrirConexion)
                await db.Database.CloseConnectionAsync();
        }
    }

    private async Task<string?> EjecutarConsultaJson(
        string sql,
        CancellationToken cancellationToken,
        params NpgsqlParameter[] parametros)
    {
        var conexion = db.Database.GetDbConnection();
        var abrirConexion = conexion.State != ConnectionState.Open;
        if (abrirConexion)
            await db.Database.OpenConnectionAsync(cancellationToken);

        try
        {
            await using var comando = conexion.CreateCommand();
            comando.Transaction = db.Database.CurrentTransaction?.GetDbTransaction();
            comando.CommandText = sql;
            comando.Parameters.AddRange(parametros);

            var resultado = await comando.ExecuteScalarAsync(cancellationToken);
            return resultado is string json ? json : null;
        }
        finally
        {
            if (abrirConexion)
                await db.Database.CloseConnectionAsync();
        }
    }

    private bool TryObtenerUsuarioId(out Guid usuarioId)
    {
        var subject = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(subject, out usuarioId);
    }

    private static bool TelefonoValido(string? telefono) =>
        !string.IsNullOrWhiteSpace(telefono) && telefono.Trim().Length is >= 7 and <= 20;
}
