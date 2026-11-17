using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/tecnicos")]
public sealed class TecnicosController(TecnoHouseDbContext db) : RecursoController<Tecnico>(db)
{
    [HttpPost]
    public async Task<ActionResult<Tecnico>> Crear([FromBody] CrearTecnicoRequest request, CancellationToken cancellationToken)
    {
        var entidad = new Tecnico
        {
            PerfilId = request.PerfilId,
            Especialidad = request.Especialidad?.Trim(),
            Disponible = request.Disponible,
        };
        await AgregarAsync(entidad, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entidad);
    }
}
