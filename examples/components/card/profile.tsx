import { Button, Card, CardDescription, CardFooter, CardHeader, CardMedia, CardMeta, CardMetaItem, CardTitle, CommentIcon, UserIcon, VerifiedIcon } from "@rdloom/react";

// Placeholder art drawn with gradients. Swap CardMedia's style for src="..." to use a photo.
const portrait =
  "radial-gradient(circle at 50% 38%, #fcd5b5 0 16%, transparent 17%), radial-gradient(ellipse at 50% 100%, #475569 0 38%, transparent 39%), linear-gradient(to bottom, #c7d2fe, #fbcfe8)";

export default function CardProfileExample() {
  return (
    <div className="w-80 max-w-full">
      <Card variant="floating" rounded="large" padding="sm">
        <CardMedia alt="Portrait of Amelia Ortiz" aspectRatio="square" style={{ background: portrait }} />
        <CardHeader className="px-2 pt-1">
          <CardTitle>
            Amelia Ortiz
            <VerifiedIcon className="size-4 shrink-0 text-[var(--rd-color-feedback-success)]" />
            <span className="sr-only">Verified</span>
          </CardTitle>
          <CardDescription>Product designer. Writes about calm interfaces and the small details that make them feel kind.</CardDescription>
        </CardHeader>
        <CardFooter className="mx-2 mb-1 justify-between">
          <CardMeta>
            <CardMetaItem icon={<UserIcon />}>312</CardMetaItem>
            <CardMetaItem icon={<CommentIcon />}>48</CardMetaItem>
          </CardMeta>
          <Button size="sm" className="!rounded-full">
            Follow +
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
