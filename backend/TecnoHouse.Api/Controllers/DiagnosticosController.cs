using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/diagnosticos")]
public sealed class DiagnosticosController(TecnoHouseDbContext db) : RecursoController<Diagnostico>(db) { }
