using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Services;

public sealed class WompiService(IOptions<WompiOptions> options)
{
    private readonly WompiOptions _options = options.Value;

    // Firma para el widget: referencia + monto en centavos + moneda + [expiración] + secreto.
    public string CrearFirmaIntegridad(
        string referencia,
        long montoEnCentavos,
        string moneda,
        string? fechaExpiracion = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(referencia);
        ArgumentException.ThrowIfNullOrWhiteSpace(moneda);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(montoEnCentavos);

        var contenido = string.Concat(
            referencia,
            montoEnCentavos.ToString(CultureInfo.InvariantCulture),
            moneda,
            fechaExpiracion,
            _options.IntegritySecret);

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(contenido))).ToLowerInvariant();
    }

    // Comprueba checksum del cuerpo y, si llega, también el encabezado X-Event-Checksum.
    public bool ValidarEvento(string jsonEvento, string? checksumEncabezado = null)
    {
        try
        {
            using var documento = JsonDocument.Parse(jsonEvento);
            var raiz = documento.RootElement;
            if (!raiz.TryGetProperty("data", out var datos)
                || !raiz.TryGetProperty("signature", out var firma)
                || !firma.TryGetProperty("properties", out var propiedades)
                || propiedades.ValueKind != JsonValueKind.Array
                || propiedades.GetArrayLength() is 0 or > 50
                || !firma.TryGetProperty("checksum", out var checksumCuerpo)
                || checksumCuerpo.ValueKind != JsonValueKind.String
                || !raiz.TryGetProperty("timestamp", out var timestamp)
                || !timestamp.TryGetInt64(out var timestampUnix))
            {
                return false;
            }

            var texto = new StringBuilder();
            foreach (var propiedad in propiedades.EnumerateArray())
            {
                if (propiedad.ValueKind != JsonValueKind.String
                    || !TryObtenerValor(datos, propiedad.GetString()!, out var valor))
                {
                    return false;
                }

                texto.Append(valor);
            }

            texto.Append(timestampUnix.ToString(CultureInfo.InvariantCulture))
                .Append(_options.EventsSecret);
            var hashEsperado = SHA256.HashData(Encoding.UTF8.GetBytes(texto.ToString()));
            var checksumCuerpoTexto = checksumCuerpo.GetString();
            var checksumHeaderTexto = checksumEncabezado?.Trim();

            if (string.IsNullOrWhiteSpace(checksumCuerpoTexto) && string.IsNullOrWhiteSpace(checksumHeaderTexto))
                return false;

            return (string.IsNullOrWhiteSpace(checksumCuerpoTexto) || Coincide(hashEsperado, checksumCuerpoTexto))
                && (string.IsNullOrWhiteSpace(checksumHeaderTexto) || Coincide(hashEsperado, checksumHeaderTexto));
        }
        catch (JsonException)
        {
            return false;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static bool TryObtenerValor(JsonElement objeto, string ruta, out string valor)
    {
        valor = "";
        var actual = objeto;
        foreach (var segmento in ruta.Split('.', StringSplitOptions.RemoveEmptyEntries))
        {
            if (actual.ValueKind != JsonValueKind.Object || !actual.TryGetProperty(segmento, out actual))
                return false;
        }

        switch (actual.ValueKind)
        {
            case JsonValueKind.String:
                valor = actual.GetString() ?? "";
                return true;
            case JsonValueKind.Number:
                valor = actual.GetRawText();
                return true;
            case JsonValueKind.True:
            case JsonValueKind.False:
                valor = actual.GetRawText();
                return true;
            default:
                return false;
        }
    }

    private static bool Coincide(byte[] hashEsperado, string checksum)
    {
        try
        {
            var hashRecibido = Convert.FromHexString(checksum);
            return hashRecibido.Length == hashEsperado.Length
                && CryptographicOperations.FixedTimeEquals(hashEsperado, hashRecibido);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
