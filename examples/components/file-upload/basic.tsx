import { useState } from "react";
import { FileUpload } from "@rdloom/react";

export default function FileUploadBasicExample() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="w-[26rem] max-w-full">
      <FileUpload label="Attachments" description="Up to 5 files, 5 MB each." maxFiles={5} maxSize={5 * 1024 * 1024} onChange={setFiles} />
      <p className="mt-2 text-xs text-[var(--rd-color-text-muted)]">{files.length} ready to upload</p>
    </div>
  );
}
