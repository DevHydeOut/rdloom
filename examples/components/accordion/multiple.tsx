import { Accordion, AccordionItem } from "@rdloom/react";

export default function AccordionMultipleExample() {
  return (
    <div className="w-full max-w-lg">
      {/* Several sections open at once, e.g. for settings people compare. */}
      <Accordion allowsMultipleExpanded defaultExpandedKeys={["profile", "billing"]}>
        <AccordionItem id="profile" title="Profile">
          Name, photo and bio.
        </AccordionItem>
        <AccordionItem id="billing" title="Billing">
          Plan, invoices and payment method.
        </AccordionItem>
        <AccordionItem id="notifications" title="Notifications">
          Email and push preferences.
        </AccordionItem>
      </Accordion>
    </div>
  );
}
