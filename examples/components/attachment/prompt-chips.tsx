import { useState } from "react";
import { Attachment, AttachmentList } from "@rdloom/react";

const initial = [
  { id: "a", name: "Q3 report.pdf", sizeText: "2.4 MB", mediaType: "application/pdf" },
  { id: "b", name: "customers.csv", sizeText: "180 KB", mediaType: "text/csv" },
  { id: "c", name: "assets.zip", sizeText: "12.1 MB", mediaType: "application/zip" },
];

export default function AttachmentPromptChipsExample() {
  const [files, setFiles] = useState(initial);
  return (
    <div className="flex w-full justify-center">
      <AttachmentList aria-label="Files for this prompt" className="max-w-md justify-center">
        {files.map((file) => (
          <Attachment
            key={file.id}
            name={file.name}
            sizeText={file.sizeText}
            mediaType={file.mediaType}
            onRemove={() => setFiles((all) => all.filter((f) => f.id !== file.id))}
          />
        ))}
      </AttachmentList>
    </div>
  );
}
