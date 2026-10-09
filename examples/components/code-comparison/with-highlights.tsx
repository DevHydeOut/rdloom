import { CodeComparison } from "@rdloom/react";

const before = `<button onClick={save}>
  Save
</button>`;

const after = `<Button onPress={save}>
  Save
</Button>`;

export default function CodeComparisonWithHighlightsExample() {
  return (
    <div className="flex w-full justify-center">
      <CodeComparison
        className="max-w-3xl"
        label="Button migration"
        beforeLabel="Plain element"
        afterLabel="Library button"
        before={before}
        after={after}
        beforeHighlight={[1]}
        afterHighlight={[1]}
      />
    </div>
  );
}
