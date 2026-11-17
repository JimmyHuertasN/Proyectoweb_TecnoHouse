using System.ComponentModel.DataAnnotations;

namespace TecnoHouse.Api.Models;

public sealed record CrearServicioRequest(
    long DispositivoId,
    [Required, MinLength(15)] string Problema,
    [Required, EnumDataType(typeof(GravedadServicio))] GravedadServicio? Gravedad,
    [Required] string Categoria);

public sealed record CrearDispositivoRequest(
    [Required] string Tipo,
    string? Marca,
    string? Modelo,
    string? Serial);

public sealed record CrearDiagnosticoRequest(
    long ServicioId,
    [Required] string Hallazgos,
    string? Recomendaciones);

public sealed record CrearCotizacionRequest(long ServicioId);

public sealed record CrearCotizacionItemRequest(
    long CotizacionId,
    [Required] string Concepto,
    [Range(0, double.MaxValue)] decimal Precio);

public sealed record CrearCalificacionRequest(
    long ServicioId,
    [Range(1, 5)] short Puntuacion,
    string? Comentario);

public sealed record CrearMensajeServicioRequest(
    long ServicioId,
    [Required, StringLength(500, MinimumLength = 1)] string Texto);

public sealed record CrearServicioFotoRequest(
    long ServicioId,
    [Required] string Ruta);

public sealed record CrearPerfilRequest(
    [Required] string Nombre,
    string? Telefono);

public sealed record CrearProductoRequest(
    [Required] string Nombre,
    string Descripcion,
    [Required] string Categoria,
    [Range(0, double.MaxValue)] decimal Precio,
    [Range(0, int.MaxValue)] int Stock,
    string? ImagenRuta,
    bool Activo);

public sealed record CrearTecnicoRequest(Guid PerfilId, string? Especialidad, bool Disponible);
