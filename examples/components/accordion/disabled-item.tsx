import { Accordion, AccordionItem } from "@rdloom/react";

export default function AccordionDisabledItemExample() {
  return (
    <div className="w-[32rem] max-w-full">
      <Accordion>
        <AccordionItem id="general" title="General">
          Workspace name and URL.
        </AccordionItem>
        <AccordionItem id="sso" title="Single sign-on (Enterprise plan)" isDisabled>
          SAML and SCIM settings.
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone">
          Transfer or delete the workspace.
        </AccordionItem>
      </Accordion>
    </div>
  );
}
