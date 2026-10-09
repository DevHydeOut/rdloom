import { BentoCard, BentoGrid, ChartIcon, SparkleIcon, UsersIcon } from "@rdloom/react";

export default function BentoGridWithLinksExample() {
  return (
    <div className="flex w-full justify-center">
      <BentoGrid label="Guides" className="max-w-2xl">
        <BentoCard
          rowSpan={2}
          icon={<SparkleIcon />}
          title="Start here"
          description="Install the CLI, add your first component and see it in your app."
          href="#install"
          actionLabel="Read the install guide"
        />
        <BentoCard icon={<UsersIcon />} title="Theming" description="Change the tokens once and every component follows." href="#theming" actionLabel="Open theming" />
        <BentoCard icon={<ChartIcon />} title="Accessibility" description="What each component promises and how it is tested." href="#a11y" actionLabel="See the checklist" />
        <BentoCard
          colSpan={2}
          title="Need a custom flow?"
          description="Press the button to see how an action card behaves."
          onAction={() => undefined}
          actionLabel="Show me"
        />
      </BentoGrid>
    </div>
  );
}
