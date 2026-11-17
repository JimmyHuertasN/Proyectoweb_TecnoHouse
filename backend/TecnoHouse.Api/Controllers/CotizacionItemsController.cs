using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/cotizacion-items")]
public sealed class CotizacionItemsController(TecnoHouseDbContext db) : RecursoController<CotizacionItem>(db)
{
    [HttpPost]
    public async Task<ActionResult<CotizacionItem>> Crear([FromBody] CrearCotizacionItemRequest request, CancellationToken cancellationToken)
    {
        var entidad = new CotizacionItem
        {
            CotizacionId = request.CotizacionId,
            Concepto = request.Concepto.Trim(),
            Precio = request.Precio,
        };
        await AgregarAsync(entidad, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entidad);
    }
}
