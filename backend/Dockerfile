# Imagen de la API TecnoHouse para publicarla (Railway u otro servicio con Docker).
# Compilar desde la carpeta backend:  docker build -t tecnohouse-api .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS compilacion
WORKDIR /src
COPY TecnoHouse.Api/TecnoHouse.Api.csproj TecnoHouse.Api/
RUN dotnet restore TecnoHouse.Api/TecnoHouse.Api.csproj
COPY TecnoHouse.Api/ TecnoHouse.Api/
RUN dotnet publish TecnoHouse.Api/TecnoHouse.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=compilacion /app .
# El servicio de hosting indica el puerto en PORT; si no lo hace, se usa 8080.
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT} exec dotnet TecnoHouse.Api.dll"]
