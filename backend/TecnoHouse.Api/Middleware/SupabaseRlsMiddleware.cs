using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using TecnoHouse.Api.Data;

namespace TecnoHouse.Api.Middleware;

/// <summary>
/// Pasa la identidad validada por Supabase a PostgreSQL y ejecuta la petición
/// como el rol authenticated. Así las políticas RLS existentes siguen aplicando.
/// </summary>
public sealed class SupabaseRlsMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, TecnoHouseDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated != true || !context.Request.Path.StartsWithSegments("/api"))
        {
            await next(context);
            return;
        }

        var subject = context.User.FindFirstValue("sub") ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out _))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(context.RequestAborted);
        await db.Database.ExecuteSqlRawAsync("SET LOCAL ROLE authenticated", context.RequestAborted);
        await using (var command = db.Database.GetDbConnection().CreateCommand())
        {
            command.Transaction = transaction.GetDbTransaction();
            command.CommandText = "SELECT set_config('request.jwt.claim.sub', @subject, true), set_config('request.jwt.claim.role', 'authenticated', true), set_config('request.jwt.claims', @claims, true)";
            command.Parameters.Add(new NpgsqlParameter("subject", subject));
            command.Parameters.Add(new NpgsqlParameter("claims", System.Text.Json.JsonSerializer.Serialize(context.User.Claims
                .GroupBy(claim => claim.Type)
                .ToDictionary(group => group.Key, group => group.Count() == 1
                    ? System.Text.Json.JsonSerializer.SerializeToElement(group.First().Value)
                    : System.Text.Json.JsonSerializer.SerializeToElement(group.Select(claim => claim.Value).ToArray())))));
            await command.ExecuteNonQueryAsync(context.RequestAborted);
        }

        await next(context);
        await transaction.CommitAsync(context.RequestAborted);
    }
}
