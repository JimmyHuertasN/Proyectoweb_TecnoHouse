using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Middleware;
using TecnoHouse.Api.Models;

var builder = WebApplication.CreateBuilder(args);

var supabaseUrl = builder.Configuration["Supabase:Url"];
var connectionString = builder.Configuration.GetConnectionString("TecnoHouse");

if (string.IsNullOrWhiteSpace(supabaseUrl))
    throw new InvalidOperationException("Configura Supabase:Url (variable Supabase__Url).");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Configura ConnectionStrings:TecnoHouse con la conexión PostgreSQL de Supabase.");

builder.Services.AddDbContext<TecnoHouseDbContext>(options => options
    .UseNpgsql(connectionString, npgsql => npgsql
        .MapEnum<RolUsuario>("rol_usuario")
        .MapEnum<EstadoServicio>("estado_servicio")
        .MapEnum<EstadoCotizacion>("estado_cotizacion")
        .MapEnum<GravedadServicio>("gravedad_servicio")));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"{supabaseUrl.TrimEnd('/')}/auth/v1";
        options.Audience = "authenticated";
        options.RequireHttpsMetadata = true;
    });
builder.Services.AddAuthorization();
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddOpenApi();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"])
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

app.UseCors("Frontend");
app.UseMiddleware<ApiExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<SupabaseRlsMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapControllers();
app.Run();
