import {
  Button,
  Card,
  CardActions,
  CardDescription,
  CardHeader,
  CardIconButton,
  CardMedia,
  CardMeta,
  CardMetaItem,
  CardTitle,
  HeartIcon,
  PlaneIcon,
  TagIcon,
} from "@rdloom/react";

// Placeholder art drawn with gradients. Swap CardMedia's style for src="..." to use a photo.
const bridge =
  "radial-gradient(circle at 78% 22%, #fde68a 0 7%, transparent 8%), linear-gradient(to bottom, #fdba74 0%, #fecaca 38%, #7dd3fc 39%, #0369a1 100%)";

export default function CardWithActionsExample() {
  return (
    <div className="w-80 max-w-full">
      <Card variant="floating" rounded="large" padding="sm">
        <CardMedia alt="A bridge at sunset over the bay" style={{ background: bridge }} />
        <CardHeader>
          <CardTitle size="lg">San Francisco</CardTitle>
          <CardDescription>Premium economy</CardDescription>
          <CardMeta className="mt-2">
            <CardMetaItem icon={<TagIcon />}>from $240</CardMetaItem>
            <CardMetaItem icon={<PlaneIcon />}>SFO</CardMetaItem>
          </CardMeta>
        </CardHeader>
        <CardActions>
          <Button className="flex-1 !rounded-full">Search flight</Button>
          <CardIconButton label="Save San Francisco" tone="outlined">
            <HeartIcon filled className="size-5 text-[var(--rd-color-feedback-danger)]" />
          </CardIconButton>
        </CardActions>
      </Card>
    </div>
  );
}
