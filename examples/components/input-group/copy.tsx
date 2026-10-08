"use client";

import { useState } from "react";
import { Button, InputGroup, InputGroupAddon, InputGroupInput } from "@rdloom/react";

const icon = { "aria-hidden": true, viewBox: "0 0 16 16", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const link = "https://example.com/invite/k3x9qw";

export default function InputGroupCopyExample() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex w-full justify-center">
      <InputGroup label="Invite link" defaultValue={link} isReadOnly className="w-80">
        <InputGroupInput />
        <InputGroupAddon type="button" align="end">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Copy link"
            className="aspect-square px-0!"
            onPress={() => {
              void navigator.clipboard?.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? (
              <svg {...icon}><path d="M3 8.5l3.5 3.5L13 4.5" /></svg>
            ) : (
              <svg {...icon}><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" /></svg>
            )}
          </Button>
        </InputGroupAddon>
        <span role="status" className="sr-only">{copied ? "Link copied" : ""}</span>
      </InputGroup>
    </div>
  );
}
