import { FieldArray, Form, FormNumberField, FormSubmitButton, FormTextField, useFormValues } from "@rdloom/react";

type Line = { description: string; qty: number | null; price: number | null };
type Values = { lines: Line[] };

// The total is this app's own arithmetic: the library only hands over the values.
function Total() {
  const total = useFormValues<Values, number>((v) => v.lines.reduce((sum, line) => sum + (line.qty ?? 0) * (line.price ?? 0), 0));
  return (
    <p className="text-sm font-medium text-[var(--rd-color-text-default)]">
      Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)}
    </p>
  );
}

export default function FieldArrayInvoiceLinesExample() {
  return (
    <Form<Values>
      className="w-full max-w-3xl"
      defaultValues={{ lines: [{ description: "Design work", qty: 10, price: 80 }] }}
      onSubmit={() => {}}
    >
      <FieldArray
        name="lines"
        label="Invoice lines"
        itemLabel="Line"
        addLabel="Add line"
        emptyText="No lines yet. Add the first one."
        defaultRow={{ description: "", qty: 1, price: null }}
        minRows={1}
        maxRows={8}
        allowInsert
      >
        {(row) => (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FormTextField name={row.name("description")} label="Description" isRequired />
            </div>
            <FormNumberField name={row.name("qty")} label="Qty" minValue={1} isRequired />
            <FormNumberField
              name={row.name("price")}
              label="Price"
              minValue={0}
              formatOptions={{ style: "currency", currency: "USD" }}
              isRequired
            />
          </div>
        )}
      </FieldArray>
      <Total />
      <FormSubmitButton>Save invoice</FormSubmitButton>
    </Form>
  );
}
