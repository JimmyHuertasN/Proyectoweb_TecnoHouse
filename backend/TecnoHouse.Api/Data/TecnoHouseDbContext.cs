using Microsoft.EntityFrameworkCore;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Data;

public sealed class TecnoHouseDbContext(DbContextOptions<TecnoHouseDbContext> options) : DbContext(options)
{
    public DbSet<Perfil> Perfiles => Set<Perfil>();
    public DbSet<Tecnico> Tecnicos => Set<Tecnico>();
    public DbSet<Dispositivo> Dispositivos => Set<Dispositivo>();
    public DbSet<Servicio> Servicios => Set<Servicio>();
    public DbSet<Diagnostico> Diagnosticos => Set<Diagnostico>();
    public DbSet<Cotizacion> Cotizaciones => Set<Cotizacion>();
    public DbSet<CotizacionItem> CotizacionItems => Set<CotizacionItem>();
    public DbSet<Calificacion> Calificaciones => Set<Calificacion>();
    public DbSet<MensajeServicio> MensajesServicio => Set<MensajeServicio>();
    public DbSet<ServicioFoto> ServicioFotos => Set<ServicioFoto>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<ProductoActivo> ProductosActivos => Set<ProductoActivo>();
    public DbSet<TecnicoPublico> TecnicosPublicos => Set<TecnicoPublico>();
    public DbSet<ResenaPublica> ResenasPublicas => Set<ResenaPublica>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.HasPostgresEnum<RolUsuario>("rol_usuario");
        model.HasPostgresEnum<EstadoServicio>("estado_servicio");
        model.HasPostgresEnum<EstadoCotizacion>("estado_cotizacion");
        model.HasPostgresEnum<GravedadServicio>("gravedad_servicio");

        model.Entity<Perfil>(entity =>
        {
            entity.ToTable("perfiles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Nombre).HasColumnName("nombre");
            entity.Property(x => x.Telefono).HasColumnName("telefono");
            entity.Property(x => x.Rol).HasColumnName("rol").HasColumnType("rol_usuario").HasDefaultValueSql("'cliente'::rol_usuario");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasOne(x => x.Tecnico).WithOne(x => x.Perfil).HasForeignKey<Tecnico>(x => x.PerfilId);
        });

        model.Entity<Tecnico>(entity =>
        {
            entity.ToTable("tecnicos");
            entity.HasKey(x => x.PerfilId);
            entity.Property(x => x.PerfilId).HasColumnName("perfil_id");
            entity.Property(x => x.Especialidad).HasColumnName("especialidad");
            entity.Property(x => x.Disponible).HasColumnName("disponible");
            entity.Property(x => x.CalificacionPromedio).HasColumnName("calificacion_promedio");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
        });

        model.Entity<Dispositivo>(entity =>
        {
            entity.ToTable("dispositivos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ClienteId).HasColumnName("cliente_id");
            entity.Property(x => x.Tipo).HasColumnName("tipo");
            entity.Property(x => x.Marca).HasColumnName("marca");
            entity.Property(x => x.Modelo).HasColumnName("modelo");
            entity.Property(x => x.Serial).HasColumnName("serial");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId);
        });

        model.Entity<Servicio>(entity =>
        {
            entity.ToTable("servicios");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ClienteId).HasColumnName("cliente_id");
            entity.Property(x => x.DispositivoId).HasColumnName("dispositivo_id");
            entity.Property(x => x.TecnicoId).HasColumnName("tecnico_id");
            entity.Property(x => x.Problema).HasColumnName("problema");
            entity.Property(x => x.Gravedad).HasColumnName("gravedad").HasColumnType("gravedad_servicio").HasDefaultValueSql("'media'::gravedad_servicio");
            entity.Property(x => x.Categoria).HasColumnName("categoria");
            entity.Property(x => x.Estado).HasColumnName("estado").HasColumnType("estado_servicio").HasDefaultValueSql("'solicitado'::estado_servicio");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId);
            entity.HasOne(x => x.Dispositivo).WithMany(x => x.Servicios).HasForeignKey(x => x.DispositivoId);
            entity.HasOne(x => x.Tecnico).WithMany().HasForeignKey(x => x.TecnicoId).OnDelete(DeleteBehavior.SetNull);
        });

        model.Entity<Diagnostico>(entity =>
        {
            entity.ToTable("diagnosticos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ServicioId).HasColumnName("servicio_id");
            entity.Property(x => x.Hallazgos).HasColumnName("hallazgos");
            entity.Property(x => x.Recomendaciones).HasColumnName("recomendaciones");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasOne(x => x.Servicio).WithMany(x => x.Diagnosticos).HasForeignKey(x => x.ServicioId);
        });

        model.Entity<Cotizacion>(entity =>
        {
            entity.ToTable("cotizaciones");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ServicioId).HasColumnName("servicio_id");
            entity.Property(x => x.Total).HasColumnName("total");
            entity.Property(x => x.Estado).HasColumnName("estado").HasColumnType("estado_cotizacion").HasDefaultValueSql("'pendiente'::estado_cotizacion");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasOne(x => x.Servicio).WithMany(x => x.Cotizaciones).HasForeignKey(x => x.ServicioId);
            entity.HasMany(x => x.Items).WithOne(x => x.Cotizacion).HasForeignKey(x => x.CotizacionId);
        });

        model.Entity<CotizacionItem>(entity =>
        {
            entity.ToTable("cotizacion_items");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CotizacionId).HasColumnName("cotizacion_id");
            entity.Property(x => x.Concepto).HasColumnName("concepto");
            entity.Property(x => x.Precio).HasColumnName("precio");
        });

        model.Entity<Calificacion>(entity =>
        {
            entity.ToTable("calificaciones");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ServicioId).HasColumnName("servicio_id");
            entity.Property(x => x.Puntuacion).HasColumnName("puntuacion");
            entity.Property(x => x.Comentario).HasColumnName("comentario");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasOne(x => x.Servicio).WithOne(x => x.Calificacion).HasForeignKey<Calificacion>(x => x.ServicioId);
        });

        model.Entity<MensajeServicio>(entity =>
        {
            entity.ToTable("mensajes_servicio");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ServicioId).HasColumnName("servicio_id");
            entity.Property(x => x.AutorId).HasColumnName("autor_id");
            entity.Property(x => x.Texto).HasColumnName("texto");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasOne(x => x.Servicio).WithMany(x => x.Mensajes).HasForeignKey(x => x.ServicioId);
            entity.HasOne(x => x.Autor).WithMany().HasForeignKey(x => x.AutorId);
        });

        model.Entity<ServicioFoto>(entity =>
        {
            entity.ToTable("servicio_fotos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ServicioId).HasColumnName("servicio_id");
            entity.Property(x => x.Ruta).HasColumnName("ruta");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasOne(x => x.Servicio).WithMany(x => x.Fotos).HasForeignKey(x => x.ServicioId);
        });

        model.Entity<Notificacion>(entity =>
        {
            entity.ToTable("notificaciones");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.UsuarioId).HasColumnName("usuario_id");
            entity.Property(x => x.Titulo).HasColumnName("titulo");
            entity.Property(x => x.Detalle).HasColumnName("detalle");
            entity.Property(x => x.Enlace).HasColumnName("enlace");
            entity.Property(x => x.Mensaje).HasColumnName("mensaje");
            entity.Property(x => x.Leida).HasColumnName("leida");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
            entity.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioId);
        });

        model.Entity<Producto>(entity =>
        {
            entity.ToTable("productos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.Nombre).HasColumnName("nombre");
            entity.Property(x => x.Descripcion).HasColumnName("descripcion").HasDefaultValue("");
            entity.Property(x => x.Categoria).HasColumnName("categoria");
            entity.Property(x => x.Precio).HasColumnName("precio");
            entity.Property(x => x.Stock).HasColumnName("stock").HasDefaultValue(0);
            entity.Property(x => x.ImagenRuta).HasColumnName("imagen_ruta");
            entity.Property(x => x.Activo).HasColumnName("activo").HasDefaultValue(true);
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en").HasDefaultValueSql("now()");
        });

        model.Entity<ProductoActivo>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("productos_activos");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Nombre).HasColumnName("nombre");
            entity.Property(x => x.Descripcion).HasColumnName("descripcion");
            entity.Property(x => x.Categoria).HasColumnName("categoria");
            entity.Property(x => x.Precio).HasColumnName("precio");
            entity.Property(x => x.Stock).HasColumnName("stock");
            entity.Property(x => x.ImagenRuta).HasColumnName("imagen_ruta");
            entity.Property(x => x.CreadoEn).HasColumnName("creado_en");
        });

        model.Entity<TecnicoPublico>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("tecnicos_publicos");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Nombre).HasColumnName("nombre");
            entity.Property(x => x.Especialidad).HasColumnName("especialidad");
            entity.Property(x => x.Disponible).HasColumnName("disponible");
            entity.Property(x => x.CalificacionPromedio).HasColumnName("calificacion_promedio");
        });

        model.Entity<ResenaPublica>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("resenas_publicas");
            entity.Property(x => x.Nombre).HasColumnName("nombre");
            entity.Property(x => x.Puntuacion).HasColumnName("puntuacion");
            entity.Property(x => x.Comentario).HasColumnName("comentario");
            entity.Property(x => x.Fecha).HasColumnName("fecha");
        });
    }
}
