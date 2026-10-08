"use client";

import { useRef, useState } from "react";
import { Button, InputGroup, InputGroupAddon, InputGroupInput } from "@rdloom/react";

const icon = { "aria-hidden": true, viewBox: "0 0 16 16", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export default function InputGroupSearchExample() {
  const [value, setValue] = useState("invoice");
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex w-full justify-center">
      <InputGroup label="Search invoices" value={value} onChange={setValue} className="w-72">
        <InputGroupAddon type="icon">
          <svg {...icon}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
        </InputGroupAddon>
        <InputGroupInput ref={input} placeholder="Customer or number" />
        {value && (
          <InputGroupAddon type="button" align="end">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Clear search"
              className="aspect-square px-0!"
              onPress={() => {
                setValue("");
                input.current?.focus();
              }}
            >
              <svg {...icon}><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </Button>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}
