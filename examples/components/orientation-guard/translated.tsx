import { OrientationGuard } from "@rdloom/react";

// labels holds every word, so it can be translated. A message that says why the orientation matters helps people decide whether to turn the phone.
export default function OrientationGuardTranslatedExample() {
  return (
    <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)]">
      <OrientationGuard
        require="landscape"
        scope="container"
        current="portrait"
        labels={{ title: "Gira el dispositivo", message: "El vídeo se ve mejor en horizontal. Gira el teléfono de lado.", dismiss: "Continuar de todos modos" }}
        className="h-full"
      >
        <div className="p-4 text-sm">Vídeo</div>
      </OrientationGuard>
    </div>
  );
}
