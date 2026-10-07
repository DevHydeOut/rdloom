import { Button, Card, CardDescription, CardIconButton, CardMedia, CardMeta, CardMetaItem, CardOverlay, CardTitle, HeartIcon, PlaneIcon, TagIcon } from "@rdloom/react";

// Placeholder art drawn with gradients. Swap CardMedia's style for src="..." to use a photo.
const skyline =
  "linear-gradient(to top, #1e293b 0 18%, transparent 18%), linear-gradient(90deg, transparent 0 12%, #334155 12% 22%, transparent 22% 30%, #475569 30% 44%, transparent 44% 52%, #334155 52% 60%, transparent 60%), linear-gradient(to bottom, #38bdf8 0%, #bae6fd 55%, #fde68a 100%)";

export default function CardFullImageExample() {
  return (
    <div className="w-80 max-w-full">
      <Card layout="overlay" rounded="large" variant="floating" className="min-h-[26rem]">
        <CardMedia alt="A city skyline at dusk" style={{ background: skyline }} />
        <CardOverlay tone="dark">
          <div className="flex flex-col gap-0.5">
            <CardTitle size="lg">New York</CardTitle>
            <CardDescription>Economy</CardDescription>
          </div>
          <CardMeta>
            <CardMetaItem icon={<TagIcon />}>from $120</CardMetaItem>
            <CardMetaItem icon={<PlaneIcon />}>JFK</CardMetaItem>
          </CardMeta>
          <Button variant="secondary" className="w-full !rounded-full">
            Search flight
          </Button>
        </CardOverlay>
        <CardIconButton label="Save New York" tone="frosted" className="absolute end-4 top-4 z-20">
          <HeartIcon className="size-5" />
        </CardIconButton>
      </Card>
    </div>
  );
}
