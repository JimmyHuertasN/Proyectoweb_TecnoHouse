using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TecnoHouse.Api.Data;

namespace TecnoHouse.Api.Controllers;

[ApiController]
[Authorize]
public abstract class RecursoController<TEntity>(TecnoHouseDbContext db) : ControllerBase where TEntity : class
{
    protected DbSet<TEntity> Filas => db.Set<TEntity>();

    [HttpGet]
    public virtual async Task<ActionResult<IReadOnlyList<TEntity>>> Listar(CancellationToken cancellationToken) =>
        Ok(await Filas.AsNoTracking().ToListAsync(cancellationToken));

    protected async Task<TEntity> AgregarAsync(TEntity entidad, CancellationToken cancellationToken)
    {
        Filas.Add(entidad);
        await db.SaveChangesAsync(cancellationToken);
        return entidad;
    }
}
