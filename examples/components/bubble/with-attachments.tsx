import { Attachment, AttachmentList, Bubble } from "@rdloom/react";

export default function BubbleWithAttachmentsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-[28rem] max-w-full flex-col gap-4">
        <Bubble
          from="user"
          name="You"
          timestamp="2026-10-08T11:20:00"
          timestampText="11:20"
          attachments={
            <AttachmentList aria-label="Sent files">
              <Attachment name="brief.pdf" sizeText="640 KB" mediaType="application/pdf" href="#brief" />
              <Attachment name="budget.xlsx" sizeText="88 KB" />
            </AttachmentList>
          }
        >
          Here are the two files.
        </Bubble>
      </div>
    </div>
  );
}
