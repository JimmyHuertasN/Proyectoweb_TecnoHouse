using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/diagnosticos")]
public sealed class DiagnosticosController(TecnoHouseDbContext db) : RecursoController<Diagnostico>(db)
{
    [HttpPost]
    public async Task<ActionResult<Diagnostico>> Crear([FromBody] CrearDiagnosticoRequest request, CancellationToken cancellationToken)
    {
        var entidad = new Diagnostico
        {
            ServicioId = request.ServicioId,
            Hallazgos = request.Hallazgos.Trim(),
            Recomendaciones = request.Recomendaciones?.Trim(),
        };
        await AgregarAsync(entidad, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entidad);
    }
}
