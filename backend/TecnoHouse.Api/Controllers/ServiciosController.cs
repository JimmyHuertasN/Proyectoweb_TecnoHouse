using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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
    public async Task<ActionResult<Servicio>> Crear([FromBody] CrearServicioRequest request, CancellationToken cancellationToken)
    {
        var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(claimId, out var clienteId)) return Unauthorized();

        var entidad = new Servicio
        {
            ClienteId = clienteId,
            DispositivoId = request.DispositivoId,
            Problema = request.Problema.Trim(),
            Gravedad = request.Gravedad!.Value,
            Categoria = request.Categoria.Trim(),
            TecnicoId = null,
            Estado = EstadoServicio.solicitado,
        };
        await AgregarAsync(entidad, cancellationToken);
        var creado = await _db.Servicios.Include(servicio => servicio.Dispositivo)
            .AsNoTracking().SingleAsync(servicio => servicio.Id == entidad.Id, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, creado);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<Servicio>> Obtener(long id, CancellationToken cancellationToken)
    {
        var servicio = await _db.Servicios.Include(fila => fila.Dispositivo)
            .AsNoTracking().SingleOrDefaultAsync(fila => fila.Id == id, cancellationToken);
        return servicio is null ? NotFound() : Ok(servicio);
    }
}
