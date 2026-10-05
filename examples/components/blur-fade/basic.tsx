import { BlurFade } from "@rdloom/react";

// Stagger a short list by giving each item a little more delay.
export default function BlurFadeBasicExample() {
  const items = ["Accessible by default", "Copy it, own it", "Upgrades that keep your edits"];
  return (
    <ul className="flex flex-col gap-2 text-lg">
      {items.map((item, i) => (
        <li key={item}>
          <BlurFade delay={i * 0.12} whenInView={false}>
            {item}
          </BlurFade>
        </li>
      ))}
    </ul>
  );
}
