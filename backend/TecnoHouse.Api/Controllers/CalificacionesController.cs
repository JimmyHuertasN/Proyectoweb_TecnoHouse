using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/calificaciones")]
public sealed class CalificacionesController(TecnoHouseDbContext db) : RecursoController<Calificacion>(db)
{
    [HttpPost]
    public async Task<ActionResult<Calificacion>> Crear([FromBody] CrearCalificacionRequest request, CancellationToken cancellationToken)
    {
        var entidad = new Calificacion
        {
            ServicioId = request.ServicioId,
            Puntuacion = request.Puntuacion,
            Comentario = request.Comentario?.Trim(),
        };
        await AgregarAsync(entidad, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entidad);
    }
}
