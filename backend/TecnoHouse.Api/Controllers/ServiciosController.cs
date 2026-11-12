using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/servicios")]
public sealed class ServiciosController : RecursoController<Servicio>
{
    private readonly TecnoHouseDbContext _db;

    public ServiciosController(TecnoHouseDbContext db) : base(db) => _db = db;

    [HttpGet]
    public override async Task<ActionResult<IReadOnlyList<Servicio>>> Listar(CancellationToken cancellationToken) =>
        Ok(await _db.Servicios.Include(servicio => servicio.Dispositivo).AsNoTracking().ToListAsync(cancellationToken));

    [HttpPost]
    public override async Task<ActionResult<Servicio>> Crear([FromBody] Servicio entidad, CancellationToken cancellationToken)
    {
        _db.Servicios.Add(entidad);
        await _db.SaveChangesAsync(cancellationToken);
        var creado = await _db.Servicios.Include(servicio => servicio.Dispositivo)
            .AsNoTracking().SingleAsync(servicio => servicio.Id == entidad.Id, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, creado);
    }
}
