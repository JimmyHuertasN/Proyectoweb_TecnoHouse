using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/servicio-fotos")]
public sealed class ServicioFotosController(TecnoHouseDbContext db) : RecursoController<ServicioFoto>(db)
{
    [HttpPost]
    public async Task<ActionResult<ServicioFoto>> Crear([FromBody] CrearServicioFotoRequest request, CancellationToken cancellationToken)
    {
        var entidad = new ServicioFoto { ServicioId = request.ServicioId, Ruta = request.Ruta.Trim() };
        await AgregarAsync(entidad, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entidad);
    }
}
