// The example previews on the docs pages show demo screens: sign-in forms that link to /sign-in, footers that link
// to /privacy, pages with their own h1. They are not part of this site, so a crawler should not follow their links
// or count their headings. Preview boxes carry data-docs-preview; these helpers find them in the built HTML.

const MARK = "data-docs-preview";

/** The [start, end) ranges of every preview box in an HTML string (nested divs are matched by depth). */
export function previewRanges(html) {
  const ranges = [];
  let from = 0;
  for (;;) {
    const at = html.indexOf(MARK, from);
    if (at === -1) break;
    const start = html.lastIndexOf("<div", at);
    if (start === -1) break;
    const tags = /<(\/?)div\b/g;
    tags.lastIndex = start;
    let depth = 0;
    let end = html.length;
    for (let m = tags.exec(html); m; m = tags.exec(html)) {
      depth += m[1] ? -1 : 1;
      if (depth === 0) {
        end = html.indexOf(">", m.index) + 1;
        break;
      }
    }
    ranges.push([start, end]);
    from = end;
  }
  return ranges;
}

/** The page without its preview boxes: only what belongs to the docs themselves. */
export function withoutPreviews(html) {
  let out = "";
  let at = 0;
  for (const [start, end] of previewRanges(html)) {
    out += html.slice(at, start);
    at = end;
  }
  return out + html.slice(at);
}

/** Inside preview boxes, internal links become "#" so crawlers do not follow demo links to pages that do not exist. */
export function neutralizeDemoLinks(html) {
  let out = "";
  let at = 0;
  for (const [start, end] of previewRanges(html)) {
    out += html.slice(at, start) + html.slice(start, end).replace(/(<a [^>]*?href=")\/[^"]*"/g, '$1#"');
    at = end;
  }
  return out + html.slice(at);
}
