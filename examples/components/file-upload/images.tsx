import { FileUpload } from "@rdloom/react";

// accept takes MIME types, wildcards and extensions. Check the files on your server too.
export default function FileUploadImagesExample() {
  return (
    <div className="w-[26rem] max-w-full">
      <FileUpload label="Photos" description="PNG or JPEG, up to 2 MB each." accept={["image/png", "image/jpeg"]} maxSize={2 * 1024 * 1024} browseLabel="Choose photos" />
    </div>
  );
}
