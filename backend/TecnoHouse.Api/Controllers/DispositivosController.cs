using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/dispositivos")]
public sealed class DispositivosController(TecnoHouseDbContext db) : RecursoController<Dispositivo>(db)
{
    [HttpPost]
    public async Task<ActionResult<Dispositivo>> Crear([FromBody] CrearDispositivoRequest request, CancellationToken cancellationToken)
    {
        var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(claimId, out var clienteId)) return Unauthorized();

        var entidad = new Dispositivo
        {
            ClienteId = clienteId,
            Tipo = request.Tipo.Trim(),
            Marca = request.Marca?.Trim(),
            Modelo = request.Modelo?.Trim(),
            Serial = request.Serial?.Trim(),
        };
        await AgregarAsync(entidad, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entidad);
    }
}
