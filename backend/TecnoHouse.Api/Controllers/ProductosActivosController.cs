using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/productos-activos")]
public sealed class ProductosActivosController(TecnoHouseDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductoActivo>>> Listar(CancellationToken cancellationToken) =>
        Ok(await db.ProductosActivos.AsNoTracking().ToListAsync(cancellationToken));
}
