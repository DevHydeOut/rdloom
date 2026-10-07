import { Accordion, AccordionItem } from "@rdloom/react";

export default function AccordionBasicExample() {
  return (
    <div className="w-[32rem] max-w-full">
      <Accordion defaultExpandedKeys={["own"]}>
        <AccordionItem id="own" title="Do I own the code?">
          Yes. rdloom add copies the source into your project. Change anything; upgrades merge into your edits.
        </AccordionItem>
        <AccordionItem id="react" title="Which React version?">
          React 19, with Tailwind CSS v4.
        </AccordionItem>
        <AccordionItem id="a11y" title="Is it accessible?">
          Every component is built on React Aria and tested with axe, keyboard tests and a screen reader checklist.
        </AccordionItem>
      </Accordion>
    </div>
  );
}
