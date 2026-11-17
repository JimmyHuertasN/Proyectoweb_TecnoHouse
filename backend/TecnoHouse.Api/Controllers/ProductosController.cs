using Microsoft.AspNetCore.Mvc;
using TecnoHouse.Api.Data;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Controllers;

[Route("api/productos")]
public sealed class ProductosController(TecnoHouseDbContext db) : RecursoController<Producto>(db)
{
    [HttpPost]
    public async Task<ActionResult<Producto>> Crear([FromBody] CrearProductoRequest request, CancellationToken cancellationToken)
    {
        var entidad = new Producto
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion.Trim(),
            Categoria = request.Categoria.Trim(),
            Precio = request.Precio,
            Stock = request.Stock,
            ImagenRuta = request.ImagenRuta?.Trim(),
            Activo = request.Activo,
        };
        await AgregarAsync(entidad, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entidad);
    }
}
