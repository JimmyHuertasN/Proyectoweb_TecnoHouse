using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/cotizaciones")]
public sealed class CotizacionesController(TecnoHouseDbContext db) : RecursoController<Cotizacion>(db)
{
    [HttpPost]
    public async Task<ActionResult<Cotizacion>> Crear([FromBody] CrearCotizacionRequest request, CancellationToken cancellationToken)
    {
        var entidad = new Cotizacion { ServicioId = request.ServicioId, Total = 0, Estado = EstadoCotizacion.pendiente };
        await AgregarAsync(entidad, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entidad);
    }
}
