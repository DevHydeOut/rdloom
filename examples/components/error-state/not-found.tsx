import { Button, ErrorState } from "@rdloom/react";

// A whole screen: the variant is "page" and the title is the page h1.
export default function ErrorStateNotFoundExample() {
  return (
    <div className="flex w-[48rem] max-w-full">
      <ErrorState
        variant="page"
        headingLevel={1}
        code="404"
        title="Page not found"
        description="The page you are looking for has moved or does not exist."
        actions={<Button>Go to the dashboard</Button>}
      />
    </div>
  );
}
