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

    [Fact]
    public void RotaLosIntentosNoResueltosYNoDejaAlIntento51FueraDelLote()
    {
        var inicio = DateTimeOffset.Parse("2026-11-20T12:00:00Z");
        var pendientes = Enumerable.Range(1, 51)
            .Select(numero => new IntentoPendiente(
                $"PED-{numero:D2}",
                inicio.AddHours(-2).AddMinutes(numero),
                null))
            .ToList();
        var referenciasConsultadas = new List<string>();
        var lotes = new List<List<string>>();

        // Simula tres ciclos de la consulta SQL: elegibles primero los nunca revisados,
        // luego los de marca de revisión más antigua; cada seleccionado recibe una marca única.
        for (var ciclo = 0; ciclo < 3; ciclo++)
        {
            var ahora = inicio.AddMinutes(ciclo * 5).AddSeconds(ciclo);
            var lote = pendientes
                .Where(p => p.CreadoEn < ahora.AddMinutes(-10))
                .Where(p => p.UltimaConsultaEn is null || p.UltimaConsultaEn <= ahora.AddMinutes(-5))
                .OrderBy(p => p.UltimaConsultaEn)
                .ThenBy(p => p.CreadoEn)
                .ThenBy(p => p.Referencia, StringComparer.Ordinal)
                .Take(50)
                .ToList();

            var referenciasLote = lote.Select(p => p.Referencia).ToList();
            lotes.Add(referenciasLote);
            referenciasConsultadas.AddRange(referenciasLote);
            for (var indice = 0; indice < lote.Count; indice++)
            {
                var intento = lote[indice];
                var posicion = pendientes.FindIndex(p => p.Referencia == intento.Referencia);
                pendientes[posicion] = intento with { UltimaConsultaEn = ahora.AddTicks(indice * 10L) };
            }
        }

        Assert.DoesNotContain("PED-51", lotes[0]);
        Assert.Contains("PED-51", lotes[1]);
        Assert.NotEqual(lotes[0], lotes[1]);
        Assert.Contains("PED-51", referenciasConsultadas);
        Assert.All(pendientes, intento => Assert.NotNull(intento.UltimaConsultaEn));
    }

    private static WompiTransaction Crear(string id, EstadoTransaccionWompi estado, string referencia = Referencia) =>
        new(id, referencia, estado, 4_950_000L, "COP", "NEQUI");

    private sealed record IntentoPendiente(
        string Referencia,
        DateTimeOffset CreadoEn,
        DateTimeOffset? UltimaConsultaEn);
}
