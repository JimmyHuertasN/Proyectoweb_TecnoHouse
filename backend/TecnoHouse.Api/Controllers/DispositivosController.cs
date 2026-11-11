using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/dispositivos")]
public sealed class DispositivosController(TecnoHouseDbContext db) : RecursoController<Dispositivo>(db) { }
