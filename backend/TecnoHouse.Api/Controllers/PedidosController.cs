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

    private static bool TelefonoValido(string? telefono) =>
        !string.IsNullOrWhiteSpace(telefono) && telefono.Trim().Length is >= 7 and <= 20;
}
