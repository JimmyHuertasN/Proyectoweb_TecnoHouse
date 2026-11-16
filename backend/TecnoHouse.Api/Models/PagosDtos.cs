namespace TecnoHouse.Api.Models;

public sealed record IniciarPagoWompiResponse(string CheckoutUrl);

public sealed record ErrorPagoResponse(string Error);

public sealed record EstadoPagoPedidoResponse(
    string EstadoPago,
    string Referencia,
    long MontoCentavos,
    string? MetodoPago);
