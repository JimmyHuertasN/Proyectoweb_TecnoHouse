using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Clients;

public sealed class WompiApiClient(HttpClient httpClient, IOptions<WompiOptions> options)
{
    private readonly string _privateKey = options.Value.PrivateKey;

    public async Task<WompiTransaction> ObtenerTransaccionAsync(
        string idTransaccion,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idTransaccion);
        using var documento = await ObtenerJsonAsync(
            $"transactions/{Uri.EscapeDataString(idTransaccion)}", cancellationToken);
        return ParsearTransaccion(ObtenerData(documento.RootElement));
    }

    public async Task<IReadOnlyList<WompiTransaction>> BuscarTransaccionesPorReferenciaAsync(
        string referencia,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(referencia);
        using var documento = await ObtenerJsonAsync(
            $"transactions?reference={Uri.EscapeDataString(referencia)}", cancellationToken);
        var data = ObtenerData(documento.RootElement);

        if (data.ValueKind == JsonValueKind.Array)
            return data.EnumerateArray().Select(ParsearTransaccion).ToArray();

        if (data.ValueKind == JsonValueKind.Object && data.TryGetProperty("id", out _))
            return [ParsearTransaccion(data)];

        throw new WompiApiException("Wompi devolvió un formato inesperado al buscar por referencia.");
    }

    private async Task<JsonDocument> ObtenerJsonAsync(string ruta, CancellationToken cancellationToken)
    {
        try
        {
            using var respuesta = await SendAuthenticatedAsync(
                HttpMethod.Get, ruta, cancellationToken: cancellationToken);
            if (!respuesta.IsSuccessStatusCode)
            {
                throw new WompiApiException(
                    $"Wompi respondió con HTTP {(int)respuesta.StatusCode}.", respuesta.StatusCode);
            }

            await using var flujo = await respuesta.Content.ReadAsStreamAsync(cancellationToken);
            return await JsonDocument.ParseAsync(flujo, cancellationToken: cancellationToken);
        }
        catch (OperationCanceledException error) when (!cancellationToken.IsCancellationRequested)
        {
            throw new WompiApiException("La consulta a Wompi excedió el tiempo de espera.", innerException: error);
        }
        catch (HttpRequestException error)
        {
            throw new WompiApiException("No fue posible comunicarse con Wompi.", innerException: error);
        }
        catch (JsonException error)
        {
            throw new WompiApiException("Wompi devolvió una respuesta que no es JSON válido.", innerException: error);
        }
    }

    private static JsonElement ObtenerData(JsonElement raiz)
    {
        if (raiz.ValueKind != JsonValueKind.Object || !raiz.TryGetProperty("data", out var data))
            throw new WompiApiException("Wompi devolvió una respuesta sin el campo data.");
        return data;
    }

    private static WompiTransaction ParsearTransaccion(JsonElement data)
    {
        try
        {
            var id = LeerString(data, "id");
            var referencia = LeerString(data, "reference");
            var estado = LeerString(data, "status").ToUpperInvariant() switch
            {
                "PENDING" => EstadoTransaccionWompi.Pending,
                "APPROVED" => EstadoTransaccionWompi.Approved,
                "DECLINED" => EstadoTransaccionWompi.Declined,
                "VOIDED" => EstadoTransaccionWompi.Voided,
                "ERROR" => EstadoTransaccionWompi.Error,
                _ => throw new FormatException("Estado de transacción desconocido."),
            };

            if (!data.TryGetProperty("amount_in_cents", out var monto)
                || !monto.TryGetInt64(out var montoEnCentavos))
            {
                throw new FormatException("Monto de transacción ausente o inválido.");
            }

            var moneda = LeerString(data, "currency");
            var metodo = LeerStringOpcional(data, "payment_method_type");
            if (metodo is null
                && data.TryGetProperty("payment_method", out var paymentMethod)
                && paymentMethod.ValueKind == JsonValueKind.Object)
            {
                metodo = LeerStringOpcional(paymentMethod, "type");
            }

            return new WompiTransaction(id, referencia, estado, montoEnCentavos, moneda, metodo);
        }
        catch (FormatException error)
        {
            throw new WompiApiException("Wompi devolvió datos de transacción incompletos o inválidos.", innerException: error);
        }
    }

    private static string LeerString(JsonElement objeto, string propiedad) =>
        LeerStringOpcional(objeto, propiedad)
        ?? throw new FormatException($"Falta la propiedad {propiedad}.");

    private static string? LeerStringOpcional(JsonElement objeto, string propiedad) =>
        objeto.TryGetProperty(propiedad, out var valor) && valor.ValueKind == JsonValueKind.String
            ? valor.GetString()
            : null;

    // Usa esta variante para recursos públicos; no adjunta credenciales.
    public Task<HttpResponseMessage> SendPublicAsync(
        HttpMethod method,
        string rutaRelativa,
        HttpContent? contenido = null,
        CancellationToken cancellationToken = default) =>
        EnviarAsync(method, rutaRelativa, contenido, usarLlavePrivada: false, cancellationToken);

    // La llave privada se agrega solo a solicitudes que explícitamente la requieren.
    public Task<HttpResponseMessage> SendAuthenticatedAsync(
        HttpMethod method,
        string rutaRelativa,
        HttpContent? contenido = null,
        CancellationToken cancellationToken = default) =>
        EnviarAsync(method, rutaRelativa, contenido, usarLlavePrivada: true, cancellationToken);

    private Task<HttpResponseMessage> EnviarAsync(
        HttpMethod method,
        string rutaRelativa,
        HttpContent? contenido,
        bool usarLlavePrivada,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rutaRelativa)
            || rutaRelativa.StartsWith("/", StringComparison.Ordinal)
            || Uri.TryCreate(rutaRelativa, UriKind.Absolute, out _))
        {
            throw new ArgumentException("La ruta de Wompi debe ser relativa a la URL base configurada.", nameof(rutaRelativa));
        }

        var solicitud = new HttpRequestMessage(method, rutaRelativa) { Content = contenido };
        if (usarLlavePrivada)
            solicitud.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _privateKey);

        return EnviarYDisponerSolicitudAsync(solicitud, cancellationToken);
    }

    private async Task<HttpResponseMessage> EnviarYDisponerSolicitudAsync(
        HttpRequestMessage solicitud,
        CancellationToken cancellationToken)
    {
        using (solicitud)
            return await httpClient.SendAsync(solicitud, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
    }
}

public enum EstadoTransaccionWompi
{
    Pending,
    Approved,
    Declined,
    Voided,
    Error,
}

public sealed record WompiTransaction(
    string Id,
    string Reference,
    EstadoTransaccionWompi Status,
    long AmountInCents,
    string Currency,
    string? PaymentMethodType);

public sealed class WompiApiException : Exception
{
    public HttpStatusCode? StatusCode { get; }

    public WompiApiException(string message, HttpStatusCode? statusCode = null, Exception? innerException = null)
        : base(message, innerException) => StatusCode = statusCode;
}
