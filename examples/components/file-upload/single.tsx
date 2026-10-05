import { FileUpload } from "@rdloom/react";

// With multiple off, choosing a new file replaces the old one.
export default function FileUploadSingleExample() {
  return (
    <div className="w-[26rem] max-w-full">
      <FileUpload label="Resume" description="A PDF, up to 10 MB." multiple={false} accept={[".pdf"]} maxSize={10 * 1024 * 1024} />
    </div>
  );
}
