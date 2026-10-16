import { formatearFechaHora } from "../../utilidades/formato.js";

const ListaDiagnosticos = ({ diagnosticos }) => (
    <section className="tarjeta mb-6">
        <h2 className="mb-4 text-lg font-semibold">Diagnósticos</h2>
        <ul className="space-y-4">
            {diagnosticos.map((diagnostico) => (
                <li key={diagnostico.id} className="border-l-2 border-marca pl-4">
                    <p className="text-sm whitespace-pre-line text-slate-200">{diagnostico.hallazgos}</p>
                    {diagnostico.recomendaciones && (
                        <p className="mt-1 text-sm text-slate-400">Recomendación: {diagnostico.recomendaciones}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">{formatearFechaHora(diagnostico.creadoEn)}</p>
                </li>
            ))}
        </ul>
    </section>
);

export default ListaDiagnosticos;
