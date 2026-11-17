using System.ComponentModel.DataAnnotations;

namespace TecnoHouse.Api.Models;

public sealed class CrearPedidoRequest
{
    [Required(ErrorMessage = "Incluye la lista de productos.")]
    [MinLength(1, ErrorMessage = "El pedido debe incluir al menos un producto.")]
    [MaxLength(30, ErrorMessage = "El pedido no puede incluir más de 30 líneas de producto.")]
    public List<ProductoPedidoRequest?> Productos { get; init; } = [];

    [Required(ErrorMessage = "Incluye los datos de entrega.")]
    public DatosEntregaPedidoRequest? Entrega { get; init; }
}

public sealed class ProductoPedidoRequest
{
    [Required(ErrorMessage = "Cada producto debe incluir su id.")]
    public string? Id { get; init; }

    [Required(ErrorMessage = "Cada producto debe incluir su cantidad.")]
    [Range(1, 1000, ErrorMessage = "La cantidad debe ser un entero entre 1 y 1000.")]
    public int? Cantidad { get; init; }
}

public sealed class DatosEntregaPedidoRequest
{
    [Required(ErrorMessage = "La dirección de entrega es obligatoria.")]
    [StringLength(250, MinimumLength = 1, ErrorMessage = "La dirección debe tener entre 1 y 250 caracteres.")]
    public string? Direccion { get; init; }

    [Required(ErrorMessage = "La ciudad de entrega es obligatoria.")]
    [StringLength(120, MinimumLength = 1, ErrorMessage = "La ciudad debe tener entre 1 y 120 caracteres.")]
    public string? Ciudad { get; init; }

    [Required(ErrorMessage = "El departamento de entrega es obligatorio.")]
    [StringLength(120, MinimumLength = 1, ErrorMessage = "El departamento debe tener entre 1 y 120 caracteres.")]
    public string? Departamento { get; init; }

    [StringLength(2, MinimumLength = 2, ErrorMessage = "El país debe ser un código de dos letras, como CO.")]
    public string? Pais { get; init; } = "CO";

    [Required(ErrorMessage = "El teléfono de quien recibe es obligatorio.")]
    [StringLength(20, MinimumLength = 7, ErrorMessage = "El teléfono debe tener entre 7 y 20 caracteres.")]
    public string? TelefonoReceptor { get; init; }
}

public sealed record CrearPedidoResponse(
    Guid PedidoId,
    long Numero,
    decimal Total,
    string EstadoPedido,
    string? EstadoPago);

public sealed record DatosEntregaPedidoResponse(
    string? Direccion,
    string? Ciudad,
    string? Departamento,
    string? Pais,
    string? TelefonoReceptor);

public sealed record ProductoPedidoDetalleResponse(
    string Nombre,
    int Cantidad,
    decimal PrecioUnitario);

public sealed record PedidoDetalleResponse(
    Guid PedidoId,
    long Numero,
    DateTimeOffset CreadoEn,
    DatosEntregaPedidoResponse Entrega,
    IReadOnlyList<ProductoPedidoDetalleResponse> Productos,
    decimal Total,
    string EstadoPedido,
    string? EstadoPago);

public sealed record PedidoResumenResponse(
    Guid PedidoId,
    long Numero,
    DateTimeOffset CreadoEn,
    IReadOnlyList<ProductoPedidoDetalleResponse> Productos,
    decimal Total,
    string EstadoPedido,
    string? EstadoPago);

public sealed record PaginaPedidosResponse(
    IReadOnlyList<PedidoResumenResponse> Items,
    int Page,
    int PageSize,
    long Total,
    int TotalPages);
