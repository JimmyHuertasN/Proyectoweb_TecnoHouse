using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/resenas-publicas")]
public sealed class ResenasPublicasController(TecnoHouseDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ResenaPublica>>> Listar(CancellationToken cancellationToken) =>
        Ok(await db.ResenasPublicas.AsNoTracking().ToListAsync(cancellationToken));
}
