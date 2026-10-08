import { Attachment, AttachmentList } from "@rdloom/react";

const swatch = (a: string, b: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="160" height="96" fill="url(#g)"/></svg>`)}`;

export default function AttachmentImagePreviewsExample() {
  return (
    <div className="flex w-full justify-center">
      <AttachmentList aria-label="Photos" className="justify-center">
        <Attachment variant="preview" name="sunrise.png" sizeText="820 KB" mediaType="image/png" thumbnail={<img src={swatch("#f59e0b", "#ef4444")} alt="Orange to red gradient" />} onRemove={() => {}} />
        <Attachment variant="preview" name="lake.jpg" sizeText="1.4 MB" mediaType="image/jpeg" thumbnail={<img src={swatch("#38bdf8", "#1e3a8a")} alt="Blue gradient" />} href="#lake" />
        <Attachment variant="preview" name="draft.pdf" sizeText="310 KB" mediaType="application/pdf" status="uploading" progress={60} />
      </AttachmentList>
    </div>
  );
}
