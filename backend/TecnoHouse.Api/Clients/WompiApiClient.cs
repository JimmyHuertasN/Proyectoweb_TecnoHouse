using System.Net.Http.Headers;
using Microsoft.Extensions.Options;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Clients;

public sealed class WompiApiClient(HttpClient httpClient, IOptions<WompiOptions> options)
{
    private readonly string _privateKey = options.Value.PrivateKey;

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
