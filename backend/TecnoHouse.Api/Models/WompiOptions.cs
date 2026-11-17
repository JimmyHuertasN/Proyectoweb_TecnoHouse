using Microsoft.Extensions.Options;

namespace TecnoHouse.Api.Models;

public sealed class WompiOptions
{
    public const string SectionName = "Wompi";
    public const string Sandbox = "Sandbox";
    public const string Production = "Production";
    public const string SandboxApiBaseUrl = "https://sandbox.wompi.co/v1/";

    public string Environment { get; init; } = "";
    public string PublicKey { get; init; } = "";
    public string PrivateKey { get; init; } = "";
    public string IntegritySecret { get; init; } = "";
    public string EventsSecret { get; init; } = "";
    public string ProductionApiBaseUrl { get; init; } = "";
    public string ResultPageBaseUrl { get; init; } = "";
    // Null desactiva expiration-time; un entero positivo define la vigencia en minutos.
    public int? ExpirationMinutes { get; init; }
    // Cada cuántos minutos la tarea de respaldo revisa los pagos pendientes.
    public int ReconciliationIntervalMinutes { get; init; } = 5;
    // Un pago solo se consulta a Wompi cuando lleva al menos estos minutos pendiente.
    public int PendingMinAgeMinutes { get; init; } = 10;

    public Uri GetApiBaseUri() => string.Equals(Environment, Production, StringComparison.OrdinalIgnoreCase)
        ? new Uri(ProductionApiBaseUrl.TrimEnd('/') + "/", UriKind.Absolute)
        : new Uri(SandboxApiBaseUrl, UriKind.Absolute);
}

// Los mensajes de validación identifican la opción, nunca su contenido.
public sealed class WompiOptionsValidator : IValidateOptions<WompiOptions>
{
    public ValidateOptionsResult Validate(string? name, WompiOptions options)
    {
        var errores = new List<string>();

        AgregarErrorSiVacio(options.Environment, "Wompi:Environment", errores);
        AgregarErrorSiVacio(options.PublicKey, "Wompi:PublicKey", errores);
        AgregarErrorSiVacio(options.PrivateKey, "Wompi:PrivateKey", errores);
        AgregarErrorSiVacio(options.IntegritySecret, "Wompi:IntegritySecret", errores);
        AgregarErrorSiVacio(options.EventsSecret, "Wompi:EventsSecret", errores);

        if (!string.Equals(options.Environment, WompiOptions.Sandbox, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(options.Environment, WompiOptions.Production, StringComparison.OrdinalIgnoreCase))
        {
            errores.Add("Wompi:Environment debe ser Sandbox o Production.");
        }

        var prefijos = string.Equals(options.Environment, WompiOptions.Sandbox, StringComparison.OrdinalIgnoreCase)
            ? (Public: "pub_test_", Private: "prv_test_", Integrity: "test_integrity_", Events: "test_events_")
            : (Public: "pub_prod_", Private: "prv_prod_", Integrity: "prod_integrity_", Events: "prod_events_");

        ValidarPrefijo(options.PublicKey, prefijos.Public, "Wompi:PublicKey", errores);
        ValidarPrefijo(options.PrivateKey, prefijos.Private, "Wompi:PrivateKey", errores);
        ValidarPrefijo(options.IntegritySecret, prefijos.Integrity, "Wompi:IntegritySecret", errores);
        ValidarPrefijo(options.EventsSecret, prefijos.Events, "Wompi:EventsSecret", errores);

        if (string.Equals(options.Environment, WompiOptions.Production, StringComparison.OrdinalIgnoreCase)
            && (!Uri.TryCreate(options.ProductionApiBaseUrl, UriKind.Absolute, out var uri)
                || uri.Scheme != Uri.UriSchemeHttps
                || uri.Host != "production.wompi.co"
                || !uri.AbsolutePath.TrimEnd('/').Equals("/v1", StringComparison.Ordinal)))
        {
            errores.Add("Wompi:ProductionApiBaseUrl debe ser una URL HTTPS de producción de Wompi terminada en /v1.");
        }

        if (!Uri.TryCreate(options.ResultPageBaseUrl, UriKind.Absolute, out var resultUri)
            || resultUri.Scheme is not ("http" or "https")
            || !string.IsNullOrEmpty(resultUri.Query)
            || !string.IsNullOrEmpty(resultUri.Fragment)
            || !string.IsNullOrEmpty(resultUri.UserInfo))
        {
            errores.Add("Wompi:ResultPageBaseUrl debe ser una URL absoluta sin query ni fragmento.");
        }
        else if (string.Equals(options.Environment, WompiOptions.Production, StringComparison.OrdinalIgnoreCase)
            && resultUri.Scheme != Uri.UriSchemeHttps)
        {
            errores.Add("Wompi:ResultPageBaseUrl debe usar HTTPS en producción.");
        }

        if (options.ExpirationMinutes is <= 0)
            errores.Add("Wompi:ExpirationMinutes debe ser un entero positivo o null para no usar expiración.");

        if (options.ReconciliationIntervalMinutes <= 0 || options.PendingMinAgeMinutes <= 0)
            errores.Add("Wompi:ReconciliationIntervalMinutes y Wompi:PendingMinAgeMinutes deben ser enteros positivos.");

        return errores.Count == 0 ? ValidateOptionsResult.Success : ValidateOptionsResult.Fail(errores);
    }

    private static void AgregarErrorSiVacio(string valor, string nombre, ICollection<string> errores)
    {
        if (string.IsNullOrWhiteSpace(valor))
            errores.Add($"Falta configurar {nombre}.");
    }

    private static void ValidarPrefijo(string valor, string prefijo, string nombre, ICollection<string> errores)
    {
        if (!string.IsNullOrWhiteSpace(valor) && !valor.StartsWith(prefijo, StringComparison.Ordinal))
            errores.Add($"{nombre} no corresponde al ambiente configurado.");
    }
}
