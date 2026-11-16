using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using TecnoHouse.Api.Models;
using TecnoHouse.Api.Services;
using Xunit;

namespace TecnoHouse.Api.Tests;

public sealed class WompiServiceTests
{
    private static readonly Guid PedidoId = Guid.Parse("550e8400-e29b-41d4-a716-446655440000");
    private const string ReferenciaFija = "PED-550e8400-e29b-41d4-a716-446655440000-try_1";
    private const string FirmaSinExpiracion = "7f61913e12fe142f70ecff3f672a7be076f7b23d9e1306ae034306e512974cb8";
    private const string FirmaConExpiracion = "417baabeb7a000b178c99fe4b39de5a9117b17340b1e3591d67734cdc98bd5ff";

    [Fact]
    public void GenerarReferenciaIncluyePedidoYCadaIntentoEsDistinto()
    {
        var servicio = CrearServicio();

        var primera = servicio.GenerarReferenciaIntento(PedidoId);
        var segunda = servicio.GenerarReferenciaIntento(PedidoId);

        Assert.Matches(new Regex($"^PED-{Regex.Escape(PedidoId.ToString())}-[0-9a-f]{{32}}$"), primera);
        Assert.NotEqual(primera, segunda);
    }

    [Fact]
    public void ConvertirMontoUsaDecimalYRedondeoConsistente()
    {
        var servicio = CrearServicio();

        Assert.Equal(4_950_000L, servicio.ConvertirMontoACentavos(49_500m));
        Assert.Equal(101L, servicio.ConvertirMontoACentavos(1.005m));
    }

    [Fact]
    public void FirmaSinExpiracionEsDeterministaYDependeDelMonto()
    {
        var servicio = CrearServicio();

        var firma = servicio.CrearFirmaIntegridad(ReferenciaFija, 4_950_000L);

        Assert.Equal(FirmaSinExpiracion, firma);
        Assert.Equal(firma, servicio.CrearFirmaIntegridad(ReferenciaFija, 4_950_000L));
        Assert.NotEqual(firma, servicio.CrearFirmaIntegridad(ReferenciaFija, 4_950_001L));
    }

    [Fact]
    public void FirmaConExpiracionIncluyeLaMismaFechaQueSeEnviaAlWidget()
    {
        var servicio = CrearServicio(expirationMinutes: 30);
        var instanteFijo = new DateTimeOffset(2026, 11, 16, 12, 0, 0, TimeSpan.Zero);

        var resultado = servicio.CrearFirmaIntegridadParaIntento(ReferenciaFija, 4_950_000L, instanteFijo);

        Assert.Equal("2026-11-16T12:30:00.000Z", resultado.ExpirationTime);
        Assert.Equal(FirmaConExpiracion, resultado.Firma);
    }

    [Fact]
    public void ExpiracionEstaDesactivadaPorDefecto()
    {
        var servicio = CrearServicio();

        var resultado = servicio.CrearFirmaIntegridadParaIntento(
            ReferenciaFija,
            4_950_000L,
            new DateTimeOffset(2026, 11, 16, 12, 0, 0, TimeSpan.Zero));

        Assert.Null(resultado.ExpirationTime);
        Assert.Equal(FirmaSinExpiracion, resultado.Firma);
    }

    private static WompiService CrearServicio(int? expirationMinutes = null) => new(
        Options.Create(new WompiOptions
        {
            Environment = WompiOptions.Sandbox,
            PublicKey = "pub_test_unit_test",
            PrivateKey = "prv_test_unit_test",
            IntegritySecret = "test_integrity_fixed_secret",
            EventsSecret = "test_events_unit_test",
            ExpirationMinutes = expirationMinutes,
        }));
}
