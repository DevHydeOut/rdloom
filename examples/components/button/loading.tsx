import { useState } from "react";
import { Button } from "@rdloom/react";

export default function ButtonLoadingExample() {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      isLoading={saving}
      onPress={() => {
        setSaving(true);
        setTimeout(() => setSaving(false), 2000);
      }}
    >
      {saving ? "Saving" : "Save changes"}
    </Button>
  );
}
