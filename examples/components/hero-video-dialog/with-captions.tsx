import { HeroVideoDialog } from "@rdloom/react";

// Pass track elements for captions: a video without captions fails WCAG 1.2.2. Here the captions are a small inline
// file; use a .vtt file of your own. The video is a public CC0 sample and the thumbnail a free Unsplash photo.
const captions = `data:text/vtt;charset=utf-8,${encodeURIComponent(
  "WEBVTT\n\n00:00.000 --> 00:04.000\nA flower opens in the morning light.\n\n00:04.000 --> 00:08.000\nThe petals unfold one by one.",
)}`;

export default function HeroVideoDialogWithCaptionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-3xl">
        <HeroVideoDialog
          title="A flower opening"
          videoSrc="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          poster={<img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80" alt="" className="size-full object-cover" />}
          tracks={<track kind="captions" src={captions} srcLang="en" label="English" default />}
        />
      </div>
    </div>
  );
}
