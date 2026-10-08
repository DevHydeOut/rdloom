import { useState } from "react";
import { Form, FormRating, FormSubmitButton, FormTextField } from "@rdloom/react";

export default function RatingInAFormExample() {
  const [sent, setSent] = useState<string>();

  return (
    <div className="flex min-w-0 max-w-full justify-center p-6">
      <Form defaultValues={{ comment: "", stars: 0 }} onSubmit={(values) => setSent(`Thanks: ${values.stars} stars`)} className="flex w-80 max-w-full flex-col gap-4">
        <FormRating name="stars" label="Rating" isRequired requiredMessage="Choose a rating" />
        <FormTextField name="comment" label="Comment" multiline />
        <FormSubmitButton>Send review</FormSubmitButton>
        <p className="text-sm" aria-live="polite">
          {sent ?? ""}
        </p>
      </Form>
    </div>
  );
}
