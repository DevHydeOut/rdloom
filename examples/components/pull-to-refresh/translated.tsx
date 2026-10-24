import { PullToRefresh } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const items = ["La factura 1042 se pagó", "Nuevo comentario de Ana", "La copia de seguridad terminó", "Ben se unió al equipo"];

// labels holds every word the component shows or announces, so it can be translated.
export default function PullToRefreshTranslatedExample() {
  return (
    <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <PullToRefresh
        onRefresh={() => wait(800)}
        labels={{ pull: "Tira para actualizar", release: "Suelta para actualizar", refreshing: "Actualizando", done: "Actualizado", error: "No se pudo actualizar", retry: "Reintentar", button: "Actualizar" }}
        className="h-full"
      >
        <ul className="divide-y divide-[var(--rd-color-border-default)]">
            {items.map((item) => (
              <li key={item} className="px-4 py-3 text-sm">
                {item}
              </li>
            ))}
          </ul>
      </PullToRefresh>
    </div>
  );
}
