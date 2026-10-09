import { HeroVideoDialog } from "@rdloom/react";

// Pass track elements for captions. A video without captions fails WCAG 1.2.2.
export default function HeroVideoDialogWithCaptionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-lg">
        <HeroVideoDialog
          title="Getting started in two minutes"
          videoSrc="/media/getting-started.mp4"
          poster={<div className="size-full bg-gradient-to-tr from-sky-500 to-emerald-400" />}
          tracks={<track kind="captions" src="/media/getting-started.en.vtt" srcLang="en" label="English" default />}
        />
      </div>
    </div>
  );
}
