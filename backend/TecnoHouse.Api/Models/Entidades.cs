namespace TecnoHouse.Api.Models;

public enum RolUsuario { cliente, tecnico, admin }
public enum EstadoServicio { solicitado, asignado, en_diagnostico, cotizado, aprobado, en_reparacion, finalizado, calificado }
public enum EstadoCotizacion { pendiente, aprobada, rechazada }
public enum GravedadServicio { baja, media, alta }

public sealed class Perfil
{
    public Guid Id { get; set; }
    public required string Nombre { get; set; }
    public string? Telefono { get; set; }
    public RolUsuario Rol { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Tecnico? Tecnico { get; set; }
}

public sealed class Tecnico
{
    public Guid PerfilId { get; set; }
    public string? Especialidad { get; set; }
    public bool Disponible { get; set; }
    public decimal CalificacionPromedio { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Perfil? Perfil { get; set; }
}

public sealed class Dispositivo
{
    public long Id { get; set; }
    public Guid ClienteId { get; set; }
    public required string Tipo { get; set; }
    public string? Marca { get; set; }
    public string? Modelo { get; set; }
    public string? Serial { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Perfil? Cliente { get; set; }
    public List<Servicio> Servicios { get; set; } = [];
}

public sealed class Servicio
{
    public long Id { get; set; }
    public Guid ClienteId { get; set; }
    public long DispositivoId { get; set; }
    public Guid? TecnicoId { get; set; }
    public required string Problema { get; set; }
    public GravedadServicio Gravedad { get; set; }
    public required string Categoria { get; set; }
    public EstadoServicio Estado { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Perfil? Cliente { get; set; }
    public Perfil? Tecnico { get; set; }
    public Dispositivo? Dispositivo { get; set; }
    public List<Diagnostico> Diagnosticos { get; set; } = [];
    public List<Cotizacion> Cotizaciones { get; set; } = [];
    public Calificacion? Calificacion { get; set; }
    public List<MensajeServicio> Mensajes { get; set; } = [];
    public List<ServicioFoto> Fotos { get; set; } = [];
}

public sealed class Diagnostico
{
    public long Id { get; set; }
    public long ServicioId { get; set; }
    public required string Hallazgos { get; set; }
    public string? Recomendaciones { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Servicio? Servicio { get; set; }
}

public sealed class Cotizacion
{
    public long Id { get; set; }
    public long ServicioId { get; set; }
    public decimal Total { get; set; }
    public EstadoCotizacion Estado { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Servicio? Servicio { get; set; }
    public List<CotizacionItem> Items { get; set; } = [];
}

public sealed class CotizacionItem
{
    public long Id { get; set; }
    public long CotizacionId { get; set; }
    public required string Concepto { get; set; }
    public decimal Precio { get; set; }
    public Cotizacion? Cotizacion { get; set; }
}

public sealed class Calificacion
{
    public long Id { get; set; }
    public long ServicioId { get; set; }
    public short Puntuacion { get; set; }
    public string? Comentario { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Servicio? Servicio { get; set; }
}

public sealed class MensajeServicio
{
    public long Id { get; set; }
    public long ServicioId { get; set; }
    public Guid AutorId { get; set; }
    public required string Texto { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Servicio? Servicio { get; set; }
    public Perfil? Autor { get; set; }
}

public sealed class ServicioFoto
{
    public long Id { get; set; }
    public long ServicioId { get; set; }
    public required string Ruta { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Servicio? Servicio { get; set; }
}

public sealed class Notificacion
{
    public long Id { get; set; }
    public Guid UsuarioId { get; set; }
    public required string Titulo { get; set; }
    public required string Detalle { get; set; }
    public required string Enlace { get; set; }
    public string? Mensaje { get; set; }
    public bool Leida { get; set; }
    public DateTimeOffset CreadoEn { get; set; }
    public Perfil? Usuario { get; set; }
}

public sealed class Producto
{
    public Guid Id { get; set; }
    public required string Nombre { get; set; }
    public string Descripcion { get; set; } = "";
    public required string Categoria { get; set; }
    public decimal Precio { get; set; }
    public int Stock { get; set; }
    public string? ImagenRuta { get; set; }
    public bool Activo { get; set; } = true;
    public DateTimeOffset CreadoEn { get; set; }
}

public sealed class ProductoActivo
{
    public Guid? Id { get; set; }
    public string? Nombre { get; set; }
    public string? Descripcion { get; set; }
    public string? Categoria { get; set; }
    public decimal? Precio { get; set; }
    public int? Stock { get; set; }
    public string? ImagenRuta { get; set; }
    public DateTimeOffset? CreadoEn { get; set; }
}

public sealed class TecnicoPublico
{
    public Guid? Id { get; set; }
    public string? Nombre { get; set; }
    public string? Especialidad { get; set; }
    public bool? Disponible { get; set; }
    public decimal? CalificacionPromedio { get; set; }
}

public sealed class ResenaPublica
{
    public string? Nombre { get; set; }
    public short Puntuacion { get; set; }
    public string? Comentario { get; set; }
    public DateTimeOffset Fecha { get; set; }
}
