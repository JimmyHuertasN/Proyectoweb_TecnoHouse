using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace TecnoHouse.Api.Middleware;

public sealed class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (DbUpdateException error) when (error.InnerException is PostgresException postgres)
        {
            var status = postgres.SqlState switch
            {
                "42501" => StatusCodes.Status403Forbidden,
                "23503" or "23505" or "23514" or "22P02" => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError,
            };

            logger.LogWarning(error, "PostgreSQL rechazó la operación {SqlState}.", postgres.SqlState);
            context.Response.StatusCode = status;
            await context.Response.WriteAsJsonAsync(new
            {
                error = status == StatusCodes.Status403Forbidden
                    ? "La política de seguridad no permite esta operación."
                    : status == StatusCodes.Status400BadRequest
                        ? "Los datos enviados no cumplen las reglas o relaciones de la base de datos."
                        : "No se pudo guardar el registro.",
            });
        }
    }
}
