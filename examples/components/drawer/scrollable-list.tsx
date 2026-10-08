import { Button, DialogTrigger, Drawer } from "@rdloom/react";

const countries = ["Argentina", "Brazil", "Canada", "Chile", "Denmark", "Egypt", "Finland", "Ghana", "Hungary", "India", "Japan", "Kenya", "Latvia", "Mexico", "Norway", "Peru", "Qatar", "Spain"];

export default function DrawerScrollableListExample() {
  return (
    <div className="flex w-full justify-center">
      <DialogTrigger>
        <Button variant="secondary">Choose a country</Button>
        <Drawer title="Choose a country" description="The drawer stops at 90% of the screen and the list scrolls.">
          {({ close }) => (
            <ul className="flex flex-col">
              {countries.map((name) => (
                <li key={name} className="border-b border-[var(--rd-color-border-default)] last:border-b-0">
                  <button
                    type="button"
                    className="w-full py-3 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
                    onClick={close}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Drawer>
      </DialogTrigger>
    </div>
  );
}
