using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

namespace TecnoHouse.Api.Services;

/// <summary>
/// Crea y borra cuentas con la API administrativa de Supabase Auth.
/// Usa la clave secreta (service_role), que solo vive en el servidor: nunca en React ni en variables VITE_*.
/// </summary>
public sealed class SupabaseAuthAdmin(HttpClient http, IConfiguration configuracion)
{
    private readonly string _url = (configuracion["Supabase:Url"] ?? "").TrimEnd('/');
    private readonly string? _claveServicio = configuracion["Supabase:ServiceRoleKey"];

    public bool Configurado => !string.IsNullOrWhiteSpace(_claveServicio);

    /// <summary>Crea la cuenta ya confirmada y devuelve su id. El trigger de la base crea su perfil como "cliente".</summary>
    public async Task<Guid> CrearUsuarioAsync(string correo, string contrasena, string nombre, string? telefono, CancellationToken cancelacion)
    {
        using var peticion = CrearPeticion(HttpMethod.Post, "/auth/v1/admin/users");
        peticion.Content = JsonContent.Create(new
        {
            email = correo,
            password = contrasena,
            email_confirm = true,
            user_metadata = new { nombre, telefono },
        });

        using var respuesta = await http.SendAsync(peticion, cancelacion);
        var cuerpo = await respuesta.Content.ReadAsStringAsync(cancelacion);

        if (respuesta.StatusCode is HttpStatusCode.UnprocessableEntity or HttpStatusCode.Conflict)
            throw new CuentaExistenteException();
        if (!respuesta.IsSuccessStatusCode)
            throw new InvalidOperationException($"Supabase Auth respondió {(int)respuesta.StatusCode}: {cuerpo}");

        using var json = JsonDocument.Parse(cuerpo);
        return json.RootElement.GetProperty("id").GetGuid();
    }

    /// <summary>Se usa para deshacer una cuenta recién creada si el siguiente paso falla.</summary>
    public async Task BorrarUsuarioAsync(Guid id, CancellationToken cancelacion)
    {
        using var peticion = CrearPeticion(HttpMethod.Delete, $"/auth/v1/admin/users/{id}");
        using var respuesta = await http.SendAsync(peticion, cancelacion);
        respuesta.EnsureSuccessStatusCode();
    }

    private HttpRequestMessage CrearPeticion(HttpMethod metodo, string ruta)
    {
        if (!Configurado)
            throw new InvalidOperationException("Falta Supabase:ServiceRoleKey en la configuración del servidor.");

        var peticion = new HttpRequestMessage(metodo, $"{_url}{ruta}");
        peticion.Headers.Add("apikey", _claveServicio);
        peticion.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _claveServicio);
        return peticion;
    }
}

public sealed class CuentaExistenteException() : Exception("Ese correo ya tiene una cuenta.");
