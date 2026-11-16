namespace TecnoHouse.Api.Models;

public sealed class WompiOptions
{
    public const string SectionName = "Wompi";

    public string PublicKey { get; init; } = "";
    public string PrivateKey { get; init; } = "";
    public string IntegritySecret { get; init; } = "";
    public string EventsSecret { get; init; } = "";
}
