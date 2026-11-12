import { AlertTriangle, Boxes, PackageX, Wallet } from "lucide-react";
import { formatearPesos } from "../../utilidades/formato.js";
import { productosPorReponer, resumenInventario } from "../../utilidades/inventario.js";
import TarjetaMetrica from "./TarjetaMetrica.jsx";

/* Métricas del inventario y la lista de productos que hay que reponer. */
const ResumenInventario = ({ productos }) => {
    const resumen = resumenInventario(productos);
    const porReponer = productosPorReponer(productos);

    return (
        <section aria-label="Resumen del inventario" className="mb-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaMetrica icono={Boxes} titulo="Productos a la venta" valor={resumen.activos} detalle={`${resumen.total} en total`} />
                <TarjetaMetrica icono={PackageX} titulo="Agotados" valor={resumen.agotados} detalle="Activos sin stock" />
                <TarjetaMetrica icono={AlertTriangle} titulo="Poco stock" valor={resumen.pocoStock} detalle="Quedan pocas unidades" />
                <TarjetaMetrica icono={Wallet} titulo="Valor del inventario" valor={formatearPesos(resumen.valor)} detalle="Precio × stock de los activos" />
            </div>

            {porReponer.length > 0 && (
                <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-200">
                        <AlertTriangle size={16} aria-hidden="true" /> Por reponer
                    </p>
                    <ul className="flex flex-wrap gap-2">
                        {porReponer.map((producto) => (
                            <li key={producto.id} className="rounded-full border border-amber-500/30 px-3 py-1 text-xs text-amber-100">
                                {producto.nombre}: {producto.stock === 0 ? "agotado" : `${producto.stock} und.`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default ResumenInventario;
