using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/calificaciones")]
public sealed class CalificacionesController(TecnoHouseDbContext db) : RecursoController<Calificacion>(db) { }
