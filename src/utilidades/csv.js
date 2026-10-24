/*
    csv.js
    Genera y descarga archivos CSV que Excel abre bien en español.
    - Separador ";": es el que usa Excel con la configuración regional de Colombia.
    - BOM UTF-8 al inicio: sin él Excel confunde las tildes y la ñ.
*/
const SEPARADOR = ";";
const BOM_UTF8 = "﻿";

/* Excel ejecuta como fórmula lo que empiece con = + - @; el apóstrofe lo deja como texto. */
const PELIGROSO = /^[=+\-@\t\r]/;

const aCelda = (valor) => {
    if (valor === null || valor === undefined) return "";
    if (typeof valor === "number") return String(valor).replace(".", ",");

    let texto = String(valor);
    if (PELIGROSO.test(texto)) texto = `'${texto}`;
    return /[";\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
};

/* "columnas" son los títulos; "filas" es una lista de listas con los valores en el mismo orden. */
export const generarCsv = (columnas, filas) =>
    BOM_UTF8 + [columnas, ...filas].map((fila) => fila.map(aCelda).join(SEPARADOR)).join("\r\n") + "\r\n";

export const descargarCsv = (nombreArchivo, contenido) => {
    const enlace = document.createElement("a");
    const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));

    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
};
