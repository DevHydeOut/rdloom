import { useState } from "react";
import { Button, Carousel, CarouselItem } from "@rdloom/react";
function SlideCard({ art, title, text }: { art: string; title: string; text: string }) {
  return (
    <div className="overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
      <div aria-hidden="true" className={`h-40 ${art}`} />
      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-sm font-semibold text-[var(--rd-color-text-default)]">{title}</h3>
        <p className="text-sm text-[var(--rd-color-text-muted)]">{text}</p>
      </div>
    </div>
  );
}

export default function CarouselControlledExample() {
  const [index, setIndex] = useState(0);
  return (
    <div className="mx-auto flex w-[28rem] max-w-full flex-col items-center gap-3">
      <Carousel label="Story picker" index={index} onIndexChange={setIndex} showDots={false}>
        <CarouselItem>
          <SlideCard art="bg-[linear-gradient(135deg,var(--rd-color-ember-400),var(--rd-color-amber-400))]" title="Spring collection" text="Light layers in soft colors, made to last more than one season." />
        </CarouselItem>
        <CarouselItem>
          <SlideCard art="bg-[linear-gradient(135deg,var(--rd-color-blue-400),var(--rd-color-green-400))]" title="Trail guide" text="Twelve routes for a long weekend, with water stops marked." />
        </CarouselItem>
        <CarouselItem>
          <SlideCard art="bg-[linear-gradient(135deg,var(--rd-color-amber-400),var(--rd-color-ember-600))]" title="Studio notes" text="How the team sketches, tests and ships a small idea in a week." />
        </CarouselItem>
        <CarouselItem>
          <SlideCard art="bg-[linear-gradient(135deg,var(--rd-color-green-400),var(--rd-color-blue-600))]" title="Quiet hours" text="A focus mode that mutes everything except the people you pick." />
        </CarouselItem>
        <CarouselItem>
          <SlideCard art="bg-[linear-gradient(135deg,var(--rd-color-ember-300),var(--rd-color-ember-700))]" title="Field report" text="What we learned from watching forty people use the first version." />
        </CarouselItem>
      </Carousel>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onPress={() => setIndex(0)}>
          First
        </Button>
        <span className="text-sm text-[var(--rd-color-text-muted)]">Showing slide {index + 1} of 5</span>
        <Button variant="secondary" size="sm" onPress={() => setIndex(4)}>
          Last
        </Button>
      </div>
    </div>
  );
}
