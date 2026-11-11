using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/notificaciones")]
public sealed class NotificacionesController(TecnoHouseDbContext db) : RecursoController<Notificacion>(db) { }
