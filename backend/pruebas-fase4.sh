#!/usr/bin/env bash
# Pruebas manuales de la Fase 4 (endurecer backend).
# Uso:
#   TOKEN=<access_token> bash backend/pruebas-fase4.sh            # solo validaciones (no escribe en la base)
#   TOKEN=<access_token> ESCRIBIR=1 bash backend/pruebas-fase4.sh # además crea 1 dispositivo y 1 servicio de prueba
# Requiere la API ejecutándose (por defecto en http://localhost:5100).

B="${API:-http://localhost:5100}"
[ -z "$TOKEN" ] && { echo "Define TOKEN con un access token de Supabase (sesión de un CLIENTE)."; exit 1; }

ok=0; fallo=0
probar() { # nombre esperado metodo ruta [cuerpo]
    local nombre="$1" esperado="$2" metodo="$3" ruta="$4" cuerpo="$5"
    local codigo
    codigo=$(curl -s -o /tmp/fase4-resp -w "%{http_code}" -X "$metodo" "$B$ruta" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" ${cuerpo:+-d "$cuerpo"})
    if [ "$codigo" = "$esperado" ]; then ok=$((ok+1)); echo "OK    [$codigo] $nombre";
    else fallo=$((fallo+1)); echo "FALLO [$codigo, se esperaba $esperado] $nombre :: $(head -c 300 /tmp/fase4-resp)"; fi
}
campo() { python3 -c "import json,sys; d=json.load(open('/tmp/fase4-resp')); print(d.get('$1'))"; }

SUB=$(python3 -c "import base64,json,sys; p=sys.argv[1].split('.')[1]; p+='='*(-len(p)%4); print(json.loads(base64.urlsafe_b64decode(p))['sub'])" "$TOKEN")
echo "Usuario del token (sub): $SUB"
echo "== Validaciones de DTO (responden 400 antes de tocar la base) =="
probar "servicios: problema corto"            400 POST /api/servicios '{"dispositivoId":1,"problema":"corto","gravedad":"media","categoria":"Otro"}'
probar "servicios: gravedad inválida"         400 POST /api/servicios '{"dispositivoId":1,"problema":"La pantalla no enciende nunca","gravedad":"urgente","categoria":"Otro"}'
probar "servicios: sin categoría"             400 POST /api/servicios '{"dispositivoId":1,"problema":"La pantalla no enciende nunca","gravedad":"media"}'
probar "servicios: sin gravedad"              400 POST /api/servicios '{"dispositivoId":1,"problema":"La pantalla no enciende nunca","categoria":"Otros"}'
probar "servicios: JSON mal formado"          400 POST /api/servicios '{"dispositivoId":'
probar "dispositivos: tipo vacío"             400 POST /api/dispositivos '{"tipo":""}'
probar "dispositivos: tipo solo espacios"     400 POST /api/dispositivos '{"tipo":"   "}'
probar "diagnosticos: sin hallazgos"          400 POST /api/diagnosticos '{"servicioId":1}'
probar "cotizacion-items: precio negativo"    400 POST /api/cotizacion-items '{"cotizacionId":1,"concepto":"Pantalla","precio":-1}'
probar "calificaciones: puntuación 6"         400 POST /api/calificaciones '{"servicioId":1,"puntuacion":6}'
probar "calificaciones: puntuación 0"         400 POST /api/calificaciones '{"servicioId":1,"puntuacion":0}'
probar "mensajes: texto vacío"                400 POST /api/mensajes-servicio '{"servicioId":1,"texto":""}'
probar "mensajes: texto de 501 caracteres"    400 POST /api/mensajes-servicio "{\"servicioId\":1,\"texto\":\"$(printf 'a%.0s' $(seq 501))\"}"
probar "servicio-fotos: sin ruta"             400 POST /api/servicio-fotos '{"servicioId":1}'
probar "perfiles: nombre vacío"               400 POST /api/perfiles '{"nombre":""}'
probar "productos: stock negativo"            400 POST /api/productos '{"nombre":"X","descripcion":"","categoria":"Y","precio":1,"stock":-1,"activo":true}'

echo "== GET /api/servicios/{id} =="
probar "servicio inexistente -> 404"          404 GET /api/servicios/999999999
probar "listar servicios"                     200 GET /api/servicios
PRIMERO=$(python3 -c "import json; d=json.load(open('/tmp/fase4-resp')); print(d[0]['id'] if d else '')")
if [ -n "$PRIMERO" ]; then
    probar "servicio visible $PRIMERO -> 200"   200 GET /api/servicios/$PRIMERO
    python3 -c "import json; d=json.load(open('/tmp/fase4-resp')); assert 'dispositivo' in d, 'falta dispositivo'" \
        && echo "OK    el detalle incluye 'dispositivo'" || { fallo=$((fallo+1)); echo "FALLO el detalle no incluye 'dispositivo'"; }
else echo "AVISO este usuario no tiene servicios; no se probó el caso 200."; fi

if [ "$ESCRIBIR" = "1" ]; then
    echo "== Campos protegidos (crea registros reales de prueba) =="
    probar "dispositivo ignorando clienteId ajeno" 201 POST /api/dispositivos \
        '{"clienteId":"00000000-0000-0000-0000-000000000001","tipo":"Prueba fase 4","marca":"Test"}'
    DISP=$(campo id); [ "$(campo clienteId)" = "$SUB" ] && echo "OK    clienteId viene del token" \
        || { fallo=$((fallo+1)); echo "FALLO clienteId=$(campo clienteId), se esperaba $SUB"; }
    probar "servicio ignorando estado/tecnicoId"   201 POST /api/servicios \
        "{\"clienteId\":\"00000000-0000-0000-0000-000000000001\",\"dispositivoId\":$DISP,\"problema\":\"Prueba automática de la fase 4\",\"gravedad\":\"baja\",\"categoria\":\"Otros\",\"estado\":\"finalizado\",\"tecnicoId\":\"00000000-0000-0000-0000-000000000002\"}"
    [ "$(campo estado)" = "solicitado" ] && [ "$(campo tecnicoId)" = "None" ] && [ "$(campo clienteId)" = "$SUB" ] \
        && echo "OK    estado=solicitado, tecnicoId=null, clienteId del token" \
        || { fallo=$((fallo+1)); echo "FALLO respuesta: $(head -c 300 /tmp/fase4-resp)"; }
    echo "Borra en Supabase el dispositivo $DISP y su servicio $(campo id) cuando termines."
fi

echo "== Resultado: $ok OK, $fallo FALLO =="
[ "$fallo" = 0 ]
