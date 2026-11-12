using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/tecnicos")]
public sealed class TecnicosController(TecnoHouseDbContext db) : RecursoController<Tecnico>(db) { }
