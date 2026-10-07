import { Card, CardDescription, CardHeader, CardMedia, CardMeta, CardMetaItem, CardTitle, PlaneIcon, TagIcon } from "@rdloom/react";

// Placeholder art drawn with gradients. Swap CardMedia's style for src="..." to use a photo.
const bridge =
  "radial-gradient(circle at 78% 22%, #fde68a 0 7%, transparent 8%), linear-gradient(to bottom, #fdba74 0%, #fecaca 38%, #7dd3fc 39%, #0369a1 100%)";

export default function CardImageTopExample() {
  return (
    <div className="w-80 max-w-full">
      <Card variant="floating" rounded="large" padding="sm">
        <CardMedia alt="A bridge at sunset over the bay" aspectRatio="photo" style={{ background: bridge }} />
        <CardHeader className="px-2 pb-2 pt-1">
          <CardTitle size="lg">San Francisco</CardTitle>
          <CardDescription>Premium economy</CardDescription>
          <CardMeta className="mt-2">
            <CardMetaItem icon={<TagIcon />}>from $240</CardMetaItem>
            <CardMetaItem icon={<PlaneIcon />}>SFO</CardMetaItem>
          </CardMeta>
        </CardHeader>
      </Card>
    </div>
  );
}
