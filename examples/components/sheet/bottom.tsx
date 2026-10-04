import { Button, DialogTrigger, Sheet } from "@rdloom/react";

export default function SheetBottomExample() {
  return (
    <DialogTrigger>
      <Button variant="secondary">Share</Button>
      {/* Bottom sheets suit phones: the content is within thumb reach. */}
      <Sheet title="Share" description="Anyone with the link can view." side="bottom" size="sm">
        {({ close }) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onPress={close}>
              Copy link
            </Button>
            <Button variant="secondary" onPress={close}>
              Email
            </Button>
            <Button variant="secondary" onPress={close}>
              Embed
            </Button>
          </div>
        )}
      </Sheet>
    </DialogTrigger>
  );
}
