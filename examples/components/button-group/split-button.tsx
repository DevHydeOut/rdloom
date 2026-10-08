import { Button, ButtonGroup, Menu, MenuItem, MenuTrigger } from "@rdloom/react";

export default function ButtonGroupSplitButtonExample() {
  return (
    <div className="flex w-full justify-center">
      <ButtonGroup label="Publish">
        <Button variant="primary">Publish</Button>
        <MenuTrigger>
          <Button variant="primary" aria-label="More publish options" className="px-2">
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </Button>
          <Menu placement="bottom end">
            <MenuItem id="schedule">Schedule for later</MenuItem>
            <MenuItem id="draft">Save as draft</MenuItem>
            <MenuItem id="preview">Preview</MenuItem>
          </Menu>
        </MenuTrigger>
      </ButtonGroup>
    </div>
  );
}
