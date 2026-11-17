using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Services;

public sealed class WompiService(IOptions<WompiOptions> options)
{
    private const string Moneda = "COP";
    private readonly WompiOptions _options = options.Value;

    // Cada intento recibe una referencia nueva y trazable al pedido; GUID aleatorio evita reutilizarla.
    public string GenerarReferenciaIntento(Guid pedidoId)
    {
        ArgumentOutOfRangeException.ThrowIfEqual(pedidoId, Guid.Empty);
        return $"PED-{pedidoId:D}-{Guid.NewGuid():N}";
    }

    // Usa decimal para conservar exactitud monetaria y redondea los medios centavos alejándose de cero.
    public long ConvertirMontoACentavos(decimal totalEnPesos)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(totalEnPesos);
        var centavos = decimal.Round(totalEnPesos * 100m, 0, MidpointRounding.AwayFromZero);
        return checked((long)centavos);
    }

    // Esta firma contiene un secreto y solo puede calcularse en el backend; nunca en React.
    // Wompi requiere referencia + centavos + COP + [expiration-time] + secreto, sin separadores.
    public string CrearFirmaIntegridad(string referencia, long montoEnCentavos, string? expirationTime = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(referencia);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(montoEnCentavos);

        var contenido = string.Concat(
            referencia,
            montoEnCentavos.ToString(CultureInfo.InvariantCulture),
            Moneda,
            expirationTime,
            _options.IntegritySecret);

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(contenido))).ToLowerInvariant();
    }

    // Devuelve la fecha exacta que debe acompañar la firma y enviarse sin cambios al widget.
    public FirmaIntegridadWompi CrearFirmaIntegridadParaIntento(
        string referencia,
        long montoEnCentavos,
        DateTimeOffset? ahoraUtc = null)
    {
        string? expirationTime = null;
        if (_options.ExpirationMinutes is int minutos)
        {
            var instante = (ahoraUtc ?? DateTimeOffset.UtcNow).ToUniversalTime();
            expirationTime = instante.AddMinutes(minutos)
                .ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
        }

        return new(CrearFirmaIntegridad(referencia, montoEnCentavos, expirationTime), expirationTime);
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

public sealed record FirmaIntegridadWompi(string Firma, string? ExpirationTime);
