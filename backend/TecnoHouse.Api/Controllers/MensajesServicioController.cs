using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/mensajes-servicio")]
public sealed class MensajesServicioController(TecnoHouseDbContext db) : RecursoController<MensajeServicio>(db)
{
    [HttpPost]
    public async Task<ActionResult<MensajeServicio>> Crear([FromBody] CrearMensajeServicioRequest request, CancellationToken cancellationToken)
    {
        var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(claimId, out var autorId)) return Unauthorized();

        var entidad = new MensajeServicio { ServicioId = request.ServicioId, AutorId = autorId, Texto = request.Texto.Trim() };
        await AgregarAsync(entidad, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entidad);
    }
}
