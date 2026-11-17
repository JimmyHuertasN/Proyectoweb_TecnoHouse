namespace TecnoHouse.Api.Models;

using System.Text.Json.Serialization;

public sealed record DatosClienteWompiResponse(
    string? Email,
    string FullName,
    string PhoneNumber,
    string PhoneNumberPrefix);

public sealed record DireccionEnvioWompiResponse(
    string AddressLine1,
    string City,
    string Region,
    string Country,
    string PhoneNumber,
    string Name);

public sealed record IniciarPagoWompiResponse(
    string PublicKey,
    string Currency,
    long AmountInCents,
    string Reference,
    string IntegritySignature,
    string RedirectUrl,
    DatosClienteWompiResponse CustomerData,
    DireccionEnvioWompiResponse ShippingAddress,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? ExpirationTime);

public sealed record ErrorPagoResponse(string Error);

public sealed record EstadoPagoPedidoResponse(
    string EstadoPago,
    string Referencia,
    long MontoCentavos,
    string? MetodoPago);
