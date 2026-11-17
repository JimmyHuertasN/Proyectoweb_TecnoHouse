using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using TecnoHouse.Api.Services;

namespace TecnoHouse.Api.Controllers;

// Wompi no envía token de usuario: la seguridad de este endpoint es el checksum del evento.
[ApiController]
[AllowAnonymous]
[Route("api/pagos/wompi/webhook")]
public sealed class WompiWebhookController(
    WompiService wompi,
    WompiEventoProcesador procesador,
    ILogger<WompiWebhookController> logger) : ControllerBase
{
    private const int TamanoMaximoCuerpo = 64 * 1024;

    [HttpPost]
    [RequestSizeLimit(TamanoMaximoCuerpo)]
    public async Task<IActionResult> Recibir(CancellationToken cancellationToken)
    {
        string cuerpo;
        using (var lector = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
            cuerpo = await lector.ReadToEndAsync(cancellationToken);

        var checksumEncabezado = Request.Headers["X-Event-Checksum"].FirstOrDefault();
        if (!wompi.ValidarEvento(cuerpo, checksumEncabezado))
        {
            logger.LogWarning("Evento Wompi rechazado: el checksum no es válido.");
            return Unauthorized();
        }

        if (WompiEventoProcesador.LeerNombreEvento(cuerpo) != WompiEventoProcesador.EventoTransaccion)
            return Ok();

        var evento = WompiEventoProcesador.LeerTransaccion(cuerpo);
        if (evento is null)
        {
            logger.LogWarning("Evento transaction.updated firmado pero sin id, estado y monto firmados.");
            return BadRequest();
        }

        try
        {
            var resultado = await procesador.ProcesarAsync(evento, cuerpo, cancellationToken);
            logger.LogInformation("Evento Wompi procesado con resultado {Resultado}.", resultado);
            return Ok();
        }
        catch (Exception error) when (error is NpgsqlException or InvalidOperationException)
        {
            // Un 500 hace que Wompi reintente el evento; el evento no quedó marcado como procesado.
            logger.LogError(error, "No se pudo procesar el evento Wompi; se espera el reintento.");
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
