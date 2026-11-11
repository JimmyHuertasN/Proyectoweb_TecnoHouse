using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/mensajes-servicio")]
public sealed class MensajesServicioController(TecnoHouseDbContext db) : RecursoController<MensajeServicio>(db) { }
