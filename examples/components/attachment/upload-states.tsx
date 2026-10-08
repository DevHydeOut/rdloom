import { Attachment, AttachmentList } from "@rdloom/react";

export default function AttachmentUploadStatesExample() {
  return (
    <div className="flex w-full justify-center">
      <AttachmentList aria-label="Uploads" className="w-[20rem] max-w-full flex-col">
        <Attachment name="contract.pdf" sizeText="1.2 MB" mediaType="application/pdf" onRemove={() => {}} />
        <Attachment name="notes.txt" sizeText="4 KB" status="uploading" progress={45} onRemove={() => {}} />
        <Attachment name="video.mov" sizeText="220 MB" status="uploading" onRemove={() => {}} />
        <Attachment name="huge.zip" sizeText="2.1 GB" mediaType="application/zip" status="error" errorMessage="Larger than 100 MB" onRemove={() => {}} />
      </AttachmentList>
    </div>
  );
}
