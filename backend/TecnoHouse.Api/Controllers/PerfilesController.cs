using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/perfiles")]
public sealed class PerfilesController : RecursoController<Perfil>
{
    private readonly TecnoHouseDbContext _db;

    public PerfilesController(TecnoHouseDbContext db) : base(db) => _db = db;

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarPerfilRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { error = "El nombre es obligatorio." });

        var usuarioId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(usuarioId, out var idSesion) || idSesion != id)
            return Forbid();

        var perfil = await _db.Perfiles.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (perfil is null) return NotFound();
        perfil.Nombre = request.Nombre.Trim();
        perfil.Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost]
    public override async Task<ActionResult<Perfil>> Crear([FromBody] Perfil entidad, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(entidad.Nombre))
            return BadRequest(new { error = "El nombre es obligatorio." });

        var usuarioId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(usuarioId, out var idSesion)) return Unauthorized();

        var perfil = await _db.Perfiles.SingleOrDefaultAsync(x => x.Id == idSesion, cancellationToken);
        if (perfil is null)
        {
            perfil = new Perfil
            {
                Id = idSesion,
                Nombre = entidad.Nombre.Trim(),
                Telefono = string.IsNullOrWhiteSpace(entidad.Telefono) ? null : entidad.Telefono.Trim(),
                Rol = RolUsuario.cliente,
            };
            _db.Perfiles.Add(perfil);
        }
        else
        {
            perfil.Nombre = entidad.Nombre.Trim();
            perfil.Telefono = string.IsNullOrWhiteSpace(entidad.Telefono) ? null : entidad.Telefono.Trim();
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(perfil);
    }
}

public sealed record ActualizarPerfilRequest(string Nombre, string? Telefono);
