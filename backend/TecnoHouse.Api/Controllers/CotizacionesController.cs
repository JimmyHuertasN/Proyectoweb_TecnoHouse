using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/cotizaciones")]
public sealed class CotizacionesController(TecnoHouseDbContext db) : RecursoController<Cotizacion>(db) { }
