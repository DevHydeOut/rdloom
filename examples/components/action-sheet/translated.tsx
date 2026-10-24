import { ActionSheet, Button, DialogTrigger } from "@rdloom/react";

// labels holds the words the sheet adds itself, so they can be translated. Your actions carry their own words.
export default function ActionSheetTranslatedExample() {
  return (
    <DialogTrigger>
      <Button variant="secondary">Factura 1042</Button>
      <ActionSheet
        title="Factura 1042"
        labels={{ cancel: "Cancelar", back: "Atrás", error: "Algo salió mal. Inténtalo de nuevo.", working: "Trabajando" }}
        actions={[
          { id: "pdf", label: "Descargar PDF", onAction: () => {} },
          { id: "delete", label: "Eliminar factura", tone: "danger", onAction: () => {}, confirm: { description: "No se puede deshacer.", confirmLabel: "Eliminar" } },
        ]}
      />
    </DialogTrigger>
  );
}
