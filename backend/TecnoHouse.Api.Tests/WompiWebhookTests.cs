using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using TecnoHouse.Api.Models;
using TecnoHouse.Api.Services;
using Xunit;

namespace TecnoHouse.Api.Tests;

public sealed class WompiWebhookTests
{
    private const string SecretoEventos = "test_events_unit_test";
    private const long Timestamp = 1_763_300_000;

    [Fact]
    public void EventoFirmadoCorrectamenteEsValido()
    {
        var evento = CrearEvento("APPROVED", 4_950_000L);

        Assert.True(CrearServicio().ValidarEvento(evento.Cuerpo));
        Assert.True(CrearServicio().ValidarEvento(evento.Cuerpo, evento.Checksum));
    }

    [Fact]
    public void CambiarElEstadoOElMontoInvalidaElEvento()
    {
        var evento = CrearEvento("DECLINED", 4_950_000L);
        var estadoAlterado = evento.Cuerpo.Replace("DECLINED", "APPROVED");
        var montoAlterado = evento.Cuerpo.Replace("4950000", "100");

        Assert.False(CrearServicio().ValidarEvento(estadoAlterado));
        Assert.False(CrearServicio().ValidarEvento(montoAlterado));
    }

    [Fact]
    public void ChecksumDeEncabezadoDistintoInvalidaElEvento()
    {
        var evento = CrearEvento("APPROVED", 4_950_000L);

        Assert.False(CrearServicio().ValidarEvento(evento.Cuerpo, new string('a', 64)));
    }

    [Fact]
    public void EventoFirmadoConOtroSecretoSeRechaza()
    {
        var evento = CrearEvento("APPROVED", 4_950_000L, secreto: "test_events_otro_secreto");

        Assert.False(CrearServicio().ValidarEvento(evento.Cuerpo, evento.Checksum));
    }

    [Fact]
    public void LeerTransaccionExtraeLosDatosDelPago()
    {
        var evento = CrearEvento("APPROVED", 4_950_000L);

        var leido = WompiEventoProcesador.LeerTransaccion(evento.Cuerpo);

        Assert.NotNull(leido);
        Assert.Equal("1234-5678-90", leido.TransaccionId);
        Assert.Equal("PED-ref-1", leido.Referencia);
        Assert.Equal("APPROVED", leido.Estado);
        Assert.Equal(4_950_000L, leido.MontoEnCentavos);
        Assert.Equal("NEQUI", leido.MetodoPago);
        Assert.Equal(evento.Checksum, leido.Checksum);
    }

    [Fact]
    public void LeerTransaccionExigeQueLaFirmaCubraIdEstadoYMonto()
    {
        var sinMonto = CrearEvento("APPROVED", 4_950_000L, propiedades: ["transaction.id", "transaction.status"]);

        Assert.Null(WompiEventoProcesador.LeerTransaccion(sinMonto.Cuerpo));
    }

    [Fact]
    public void SoloTransactionUpdatedSeProcesa()
    {
        var evento = CrearEvento("APPROVED", 4_950_000L, nombreEvento: "nequi_token.updated");

        Assert.Equal("nequi_token.updated", WompiEventoProcesador.LeerNombreEvento(evento.Cuerpo));
        Assert.Null(WompiEventoProcesador.LeerNombreEvento("no es json"));
    }

    private static (string Cuerpo, string Checksum) CrearEvento(
        string estado,
        long monto,
        string secreto = SecretoEventos,
        string[]? propiedades = null,
        string nombreEvento = "transaction.updated")
    {
        propiedades ??= ["transaction.id", "transaction.status", "transaction.amount_in_cents"];
        var valores = new Dictionary<string, string>
        {
            ["transaction.id"] = "1234-5678-90",
            ["transaction.status"] = estado,
            ["transaction.amount_in_cents"] = monto.ToString(),
        };
        var texto = string.Concat(propiedades.Select(p => valores[p])) + Timestamp + secreto;
        var checksum = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(texto))).ToLowerInvariant();
        var lista = string.Join(",", propiedades.Select(p => $"\"{p}\""));

        var cuerpo = $$"""
            {
              "event": "{{nombreEvento}}",
              "data": {
                "transaction": {
                  "id": "1234-5678-90",
                  "status": "{{estado}}",
                  "amount_in_cents": {{monto}},
                  "reference": "PED-ref-1",
                  "currency": "COP",
                  "payment_method_type": "NEQUI"
                }
              },
              "environment": "test",
              "signature": { "properties": [{{lista}}], "checksum": "{{checksum}}" },
              "timestamp": {{Timestamp}},
              "sent_at": "2026-11-16T12:00:00.000Z"
            }
            """;
        return (cuerpo, checksum);
    }

    private static WompiService CrearServicio() => new(
        Options.Create(new WompiOptions
        {
            Environment = WompiOptions.Sandbox,
            PublicKey = "pub_test_unit_test",
            PrivateKey = "prv_test_unit_test",
            IntegritySecret = "test_integrity_fixed_secret",
            EventsSecret = SecretoEventos,
        }));
}
