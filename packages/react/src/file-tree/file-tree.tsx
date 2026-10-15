"use client";

import { forwardRef, type ReactNode } from "react";
import { fileTreeDefaults, type FileTreeSpecProps } from "../generated/file-tree.types";
import { Tree, TreeItem } from "../tree/tree";
import { cx } from "../utils/cx";
import { CodeFileIcon, FileIcon, FolderIcon, FolderOpenIcon, ImageIcon, TextFileIcon } from "../utils/icons";

export type FileTreeStatus = "added" | "modified" | "deleted";

export interface FileTreeNode {
  /** Key of the row. Unique across the whole tree. */
  id: string;
  /** The file or folder name, e.g. "index.ts". */
  name: string;
  /** Nested nodes. A node with this array (even an empty one) is a folder. */
  children?: FileTreeNode[];
  /** Optional size text, already formatted for the reader's locale, e.g. "2.4 KB". */
  size?: string;
  /** Optional change status, shown as a letter badge and added to the row's accessible name. */
  status?: FileTreeStatus;
}

export interface FileTreeProps extends FileTreeSpecProps {
  className?: string;
}

const CODE = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs", "json", "css", "scss", "html", "xml", "yml", "yaml", "toml", "sh", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "php", "sql"]);
const TEXT = new Set(["md", "mdx", "txt", "rtf", "csv", "log"]);
const IMAGE = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "svg"]);

/** Picks a neutral icon from the file extension. Anything unknown gets the plain file icon. */
function fileIcon(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const cls = "size-4 shrink-0 text-[var(--rd-color-text-muted)]";
  if (CODE.has(ext)) return <CodeFileIcon className={cls} />;
  if (TEXT.has(ext)) return <TextFileIcon className={cls} />;
  if (IMAGE.has(ext)) return <ImageIcon className={cls} />;
  return <FileIcon className={cls} />;
}

const STATUS: Record<FileTreeStatus, { letter: string; word: string }> = {
  added: { letter: "A", word: "added" },
  modified: { letter: "M", word: "modified" },
  deleted: { letter: "D", word: "deleted" },
};

function renderNode(node: FileTreeNode): ReactNode {
  const folder = Array.isArray(node.children);
  const status = node.status ? STATUS[node.status] : undefined;
  const title = (
    <span className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className="flex shrink-0">
        {folder ? (
          <>
            <FolderIcon className="size-4 shrink-0 text-[var(--rd-color-text-muted)] group-data-[expanded]:hidden" />
            <FolderOpenIcon className="hidden size-4 shrink-0 text-[var(--rd-color-text-muted)] group-data-[expanded]:block" />
          </>
        ) : (
          fileIcon(node.name)
        )}
      </span>
      <span className={cx("min-w-0 flex-1 truncate", node.status === "deleted" && "line-through")}>{node.name}</span>
      {node.size ? (
        <span aria-hidden="true" className="shrink-0 text-xs tabular-nums text-[var(--rd-color-text-muted)]">
          {node.size}
        </span>
      ) : null}
      {status ? (
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center rounded border border-[var(--rd-color-border-default)] text-[11px] font-semibold leading-none text-[var(--rd-color-text-default)]"
        >
          {status.letter}
        </span>
      ) : null}
    </span>
  );
  // The row's accessible name is its text value: name, then status and size, so nothing is only visual.
  const spoken = [node.name, status?.word, node.size].filter(Boolean).join(", ");
  return (
    <TreeItem key={node.id} id={node.id} title={title} textValue={spoken} className="group">
      {folder ? node.children!.map(renderNode) : null}
    </TreeItem>
  );
}

/**
 * A file and folder tree built on Tree. Folders show open and closed icons, files an icon chosen by
 * extension, and a row can carry a size or a status badge. Keyboard behaviour is the Tree's own.
 */
export const FileTree = forwardRef<HTMLDivElement, FileTreeProps>(function FileTree(
  { label, items, selectionMode = fileTreeDefaults.selectionMode, className, ...rest },
  ref,
) {
  return (
    <Tree ref={ref} label={label} selectionMode={selectionMode} className={className} {...rest}>
      {items.map(renderNode)}
    </Tree>
  );
});
