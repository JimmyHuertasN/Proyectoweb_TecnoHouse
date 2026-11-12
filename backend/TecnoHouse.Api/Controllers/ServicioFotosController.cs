using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/servicio-fotos")]
public sealed class ServicioFotosController(TecnoHouseDbContext db) : RecursoController<ServicioFoto>(db) { }
