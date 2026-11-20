using Microsoft.Extensions.Options;
using TecnoHouse.Api.Clients;
using TecnoHouse.Api.Models;

namespace TecnoHouse.Api.Services;

// Respaldo del webhook: Wompi solo reintenta 3 veces en 24 horas, y los pagos por PSE, banco o
// corresponsal pueden tardar. Esta tarea consulta a Wompi los pagos que siguen en PENDING.
public sealed class PagosPendientesWompiService(
    IServiceScopeFactory scopes,
    IOptions<WompiOptions> options,
    ILogger<PagosPendientesWompiService> logger) : BackgroundService
{
    private const int LimitePorRevision = 50;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var configuracion = options.Value;
        try
        {
            using var temporizador = new PeriodicTimer(TimeSpan.FromMinutes(configuracion.ReconciliationIntervalMinutes));
            while (await temporizador.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await RevisarAsync(
                        configuracion.PendingMinAgeMinutes,
                        configuracion.ReconciliationIntervalMinutes,
                        stoppingToken);
                }
                catch (Exception error) when (error is not OperationCanceledException)
                {
                    logger.LogError(error, "Falló la revisión de pagos pendientes de Wompi.");
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }

    private async Task RevisarAsync(
        int minutosMinimos,
        int intervaloReconsultaMinutos,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<string> referencias;
        await using (var scope = scopes.CreateAsyncScope())
        {
            referencias = await scope.ServiceProvider.GetRequiredService<WompiEventoProcesador>()
                .ListarReferenciasPendientesAsync(
                    minutosMinimos,
                    intervaloReconsultaMinutos,
                    LimitePorRevision,
                    cancellationToken);
        }

        foreach (var referencia in referencias)
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var transacciones = await scope.ServiceProvider.GetRequiredService<WompiApiClient>()
                    .BuscarTransaccionesPorReferenciaAsync(referencia, cancellationToken);
                var elegida = ElegirTransaccion(transacciones, referencia);
                if (elegida is null)
                    continue;

                var resultado = await scope.ServiceProvider.GetRequiredService<WompiEventoProcesador>()
                    .ProcesarTransaccionConsultadaAsync(elegida, cancellationToken);
                logger.LogInformation("Respaldo Wompi: pago {Resultado} para la transacción {TransaccionId}.", resultado, elegida.Id);
            }
            catch (WompiApiException error)
            {
                logger.LogWarning("No se pudo consultar Wompi para un pago pendiente: {Mensaje}", error.Message);
            }
        }
    }

    // Solo sirve una transacción de esa referencia que ya terminó; si hay una aprobada, gana.
    public static WompiTransaction? ElegirTransaccion(IEnumerable<WompiTransaction> transacciones, string referencia)
    {
        var propias = transacciones
            .Where(t => string.Equals(t.Reference, referencia, StringComparison.Ordinal)
                && t.Status != EstadoTransaccionWompi.Pending)
            .ToList();

        return propias.FirstOrDefault(t => t.Status == EstadoTransaccionWompi.Approved)
            ?? propias.FirstOrDefault();
    }
}
