using TecnoHouse.Api.Clients;
using TecnoHouse.Api.Services;
using Xunit;

namespace TecnoHouse.Api.Tests;

public sealed class PagosPendientesWompiServiceTests
{
    private const string Referencia = "PED-1-abc";

    [Fact]
    public void LaTransaccionAprobadaTienePrioridad()
    {
        var elegida = PagosPendientesWompiService.ElegirTransaccion(
            [Crear("t1", EstadoTransaccionWompi.Declined), Crear("t2", EstadoTransaccionWompi.Approved)],
            Referencia);

        Assert.Equal("t2", elegida?.Id);
    }

    [Fact]
    public void IgnoraTransaccionesPendientesYDeOtraReferencia()
    {
        var elegida = PagosPendientesWompiService.ElegirTransaccion(
            [Crear("t1", EstadoTransaccionWompi.Pending), Crear("t2", EstadoTransaccionWompi.Approved, "otra")],
            Referencia);

        Assert.Null(elegida);
    }

    [Fact]
    public void SinAprobadaUsaUnEstadoFinal()
    {
        var elegida = PagosPendientesWompiService.ElegirTransaccion(
            [Crear("t1", EstadoTransaccionWompi.Voided)], Referencia);

        Assert.Equal(EstadoTransaccionWompi.Voided, elegida?.Status);
    }

    private static WompiTransaction Crear(string id, EstadoTransaccionWompi estado, string referencia = Referencia) =>
        new(id, referencia, estado, 4_950_000L, "COP", "NEQUI");
}
