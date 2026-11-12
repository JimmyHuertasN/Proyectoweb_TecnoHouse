using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/tecnicos-publicos")]
public sealed class TecnicosPublicosController(TecnoHouseDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TecnicoPublico>>> Listar(CancellationToken cancellationToken) =>
        Ok(await db.TecnicosPublicos.AsNoTracking().ToListAsync(cancellationToken));
}
