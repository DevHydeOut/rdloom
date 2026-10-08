import { Button, DialogTrigger, Drawer } from "@rdloom/react";

export default function DrawerBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <DialogTrigger>
        <Button variant="secondary">Share</Button>
        <Drawer title="Share this report" description="Anyone with the link can view it.">
          {({ close }) => (
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onPress={close}>
                Copy link
              </Button>
              <Button variant="secondary" onPress={close}>
                Send by email
              </Button>
              <Button variant="ghost" onPress={close}>
                Cancel
              </Button>
            </div>
          )}
        </Drawer>
      </DialogTrigger>
    </div>
  );
}
