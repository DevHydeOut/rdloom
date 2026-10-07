import { useState } from "react";
import { Form, FormColorPicker, FormSubmitButton, FormTextField } from "@rdloom/react";

export default function ColorPickerInAFormExample() {
  const [saved, setSaved] = useState<string>();

  return (
    <div className="flex justify-center p-6">
      <Form
        defaultValues={{ name: "Design", color: "#d9480f" }}
        onSubmit={(values) => setSaved(`${values.name}: ${values.color}`)}
        className="flex w-72 flex-col gap-4"
      >
        <FormTextField name="name" label="Label name" isRequired />
        <FormColorPicker
          name="color"
          label="Label color"
          presets={["#d9480f", "#2f9e44", "#1971c2"]}
          validate={(value) => (value === "#ffffff" ? "White is hard to see on a light page" : undefined)}
        />
        <FormSubmitButton>Save label</FormSubmitButton>
        <p className="text-sm" aria-live="polite">
          {saved ?? ""}
        </p>
      </Form>
    </div>
  );
}
