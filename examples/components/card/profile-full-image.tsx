import { Button, Card, CardDescription, CardMedia, CardMeta, CardMetaItem, CardOverlay, CardTitle, CommentIcon, UserIcon, VerifiedIcon } from "@rdloom/react";

// Placeholder art drawn with gradients. Swap CardMedia's style for src="..." to use a photo.
const portrait =
  "radial-gradient(circle at 50% 34%, #fcd5b5 0 13%, transparent 14%), radial-gradient(ellipse at 50% 70%, #475569 0 30%, transparent 31%), linear-gradient(to bottom, #c7d2fe, #fbcfe8)";

export default function CardProfileFullImageExample() {
  return (
    <div className="w-80 max-w-full">
      <Card layout="overlay" rounded="large" variant="floating" className="min-h-[26rem]">
        <CardMedia alt="Portrait of Amelia Ortiz" style={{ background: portrait }} />
        <CardOverlay tone="light">
          <div className="flex flex-col gap-0.5">
            <CardTitle>
              Amelia Ortiz
              <VerifiedIcon className="size-4 shrink-0 text-[var(--rd-color-feedback-success)]" />
              <span className="sr-only">Verified</span>
            </CardTitle>
            <CardDescription>Product designer. Writes about calm interfaces and the small details that make them feel kind.</CardDescription>
          </div>
          <div className="flex items-center justify-between gap-2">
            <CardMeta>
              <CardMetaItem icon={<UserIcon />}>312</CardMetaItem>
              <CardMetaItem icon={<CommentIcon />}>48</CardMetaItem>
            </CardMeta>
            <Button size="sm" className="!rounded-full">
              Follow +
            </Button>
          </div>
        </CardOverlay>
      </Card>
    </div>
  );
}
