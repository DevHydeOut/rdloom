// Questions people ask before choosing a component set. The home page shows them and the prerender step
// writes the same text into the page's structured data, so the two can never disagree.
export const faq = [
  {
    q: "What is rdloom?",
    a: "A collection of production-ready React blocks and components that you copy into your project and own. It covers the screens around an API call: tables, forms, settings, billing, sign-in and dashboards. It never fetches data itself, so it works with any backend.",
  },
  {
    q: "How is it different from a UI library installed from npm?",
    a: "One command copies the source into your project, so you can change anything. When a new version comes out, rdloom upgrade merges it into your edits the way git does, instead of overwriting them.",
  },
  {
    q: "Does it work with Next.js, Vite and other React setups?",
    a: "It needs React 19 and Tailwind CSS. rdloom has no router and no data layer of its own, so it should fit most React apps. Our test app uses Vite. Other setups have not been tested yet.",
  },
  {
    q: "Is it accessible?",
    a: "Every component is built on React Aria and every example is checked with automated accessibility tests. Each component page lists its keyboard and screen reader behaviour. A full audit by people using screen readers is still planned.",
  },
  {
    q: "Is it free?",
    a: "Yes. The source is open and uses the MIT licence.",
  },
  {
    q: "Can I use it with Figma and AI coding tools?",
    a: "Yes. A Figma plugin syncs the design tokens and component variants, and an MCP server gives AI coding tools each component's props, usage rules and tested examples.",
  },
  {
    q: "Does it support dark mode and my own fonts?",
    a: "Dark mode comes from the design tokens. Components use your app's font and never ship or force a font of their own.",
  },
] as const;
