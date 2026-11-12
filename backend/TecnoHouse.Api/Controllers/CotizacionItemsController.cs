using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/cotizacion-items")]
public sealed class CotizacionItemsController(TecnoHouseDbContext db) : RecursoController<CotizacionItem>(db) { }
