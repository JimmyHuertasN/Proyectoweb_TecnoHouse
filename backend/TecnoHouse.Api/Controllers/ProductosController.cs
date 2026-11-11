using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/productos")]
public sealed class ProductosController(TecnoHouseDbContext db) : RecursoController<Producto>(db) { }
