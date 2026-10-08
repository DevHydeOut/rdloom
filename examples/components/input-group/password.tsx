"use client";

import { useState } from "react";
import { Button, InputGroup, InputGroupAddon, InputGroupInput } from "@rdloom/react";

const icon = { "aria-hidden": true, viewBox: "0 0 16 16", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export default function InputGroupPasswordExample() {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex w-full justify-center">
      <InputGroup label="Password" description="At least 12 characters." isRequired className="w-72">
        <InputGroupInput type={shown ? "text" : "password"} autoComplete="new-password" />
        <InputGroupAddon type="button" align="end">
          {/* The name stays the same; aria-pressed says whether the password is visible. */}
          <Button
            variant="ghost"
            size="sm"
            aria-label="Show password"
            aria-pressed={shown}
            className="aspect-square px-0!"
            onPress={() => setShown((v) => !v)}
          >
            <svg {...icon}>
              <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
              <circle cx="8" cy="8" r="2" />
              {shown && <path d="M2.5 13.5l11-11" />}
            </svg>
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
