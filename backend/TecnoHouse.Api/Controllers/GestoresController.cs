using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;
using TecnoHouse.Api.Services;

namespace TecnoHouse.Api.Controllers;

/// <summary>
/// Cuentas de gestor de tienda. Solo el administrador las crea. Listar, editar y dar o quitar
/// el rol se hace con las funciones de supabase/permisos_tienda.sql, que también validan al administrador.
/// </summary>
[ApiController]
[Authorize]
[Route("api/gestores")]
public sealed class GestoresController(TecnoHouseDbContext db, SupabaseAuthAdmin authAdmin) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearGestorRequest request, CancellationToken cancelacion)
    {
        // El rol se lee de "perfiles" con la identidad del token, igual que en las políticas RLS.
        var rol = await db.Database.SqlQuery<string>($"select public.rol_actual()::text as \"Value\"").SingleOrDefaultAsync(cancelacion);
        if (rol != "admin")
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "Solo un administrador puede crear gestores de tienda." });

        if (!authAdmin.Configurado)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                error = "El servidor no tiene la clave Supabase:ServiceRoleKey para crear cuentas. Mientras tanto, usa «Dar acceso» con una cuenta de cliente que ya exista.",
            });

        var correo = request.Correo.Trim().ToLowerInvariant();
        var telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();

        Guid id;
        try
        {
            id = await authAdmin.CrearUsuarioAsync(correo, request.Contrasena, request.Nombre.Trim(), telefono, cancelacion);
        }
        catch (CuentaExistenteException)
        {
            return Conflict(new { error = "Ese correo ya tiene una cuenta. Usa «Dar acceso» para convertirla en gestor." });
        }

        try
        {
            await db.Database.ExecuteSqlAsync($"select public.conceder_rol_gestor({correo})", cancelacion);
        }
        catch (PostgresException error)
        {
            // Sin el rol la cuenta quedaría como un cliente que nadie pidió: se borra.
            await authAdmin.BorrarUsuarioAsync(id, CancellationToken.None);
            return BadRequest(new { error = error.MessageText });
        }

        return StatusCode(StatusCodes.Status201Created, new { id, correo });
    }
}
