// The shape every AI interface component reads, and the few helpers that keep it consistent.
// Nothing here calls a model: you feed messages in, in this shape, from any backend.
// specs/schema/ai-message.schema.json is the same shape as JSON Schema.

import type { ReactNode } from "react";

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "streaming" | "complete" | "stopped" | "error";

export type ToolState = "pending" | "running" | "awaiting-approval" | "approved" | "denied" | "done" | "failed";

export interface TextPart {
  type: "text";
  /** Markdown. */
  text: string;
  streaming?: boolean;
}

export interface ReasoningPart {
  type: "reasoning";
  text: string;
  streaming?: boolean;
}

export interface ToolApproval {
  /** Plain words about what is about to happen, e.g. "Delete 12 draft invoices". */
  summary: string;
  risk?: "low" | "medium" | "high";
  reversible?: boolean;
}

export interface ToolPart {
  type: "tool";
  id: string;
  /** Machine name, e.g. `query_sales`. */
  name: string;
  /** What a person reads, e.g. "Searching your sales data". */
  title?: string;
  state: ToolState;
  input?: unknown;
  output?: unknown;
  error?: string;
  approval?: ToolApproval;
  startedAt?: string;
  endedAt?: string;
}

export interface CitationPart {
  type: "citation";
  id: string;
  title: string;
  url?: string;
  snippet?: string;
}

export interface TableData {
  columns: string[];
  rows: Array<Array<string | number | null>>;
}

export interface ChartData {
  labels: string[];
  series: Array<{ name: string; values: number[] }>;
  /** Unit shown after values, e.g. "$" or "%". Optional. */
  unit?: string;
}

export interface TableArtifactPart {
  type: "artifact";
  kind: "table";
  title: string;
  summary?: string;
  data: TableData;
}

export interface ChartArtifactPart {
  type: "artifact";
  kind: "chart";
  title: string;
  /** A sentence a screen reader gets instead of the picture. */
  summary?: string;
  data: ChartData;
}

export type ArtifactPart = TableArtifactPart | ChartArtifactPart;

export interface FilePart {
  type: "file";
  name: string;
  mediaType?: string;
  url?: string;
  size?: number;
}

export type MessagePart = TextPart | ReasoningPart | ToolPart | CitationPart | ArtifactPart | FilePart;

export interface ChatMessage {
  id: string;
  role: MessageRole;
  status?: MessageStatus;
  createdAt?: string;
  parts: MessagePart[];
}

// --- Tool states

const NEXT: Record<ToolState, readonly ToolState[]> = {
  pending: ["running", "awaiting-approval", "failed", "denied"],
  running: ["awaiting-approval", "done", "failed"],
  "awaiting-approval": ["approved", "denied"],
  approved: ["running", "done", "failed"],
  denied: [],
  done: [],
  failed: [],
};

/** Tool states only move forward, so a late or repeated update can't take a finished tool back. */
export function canMoveTool(from: ToolState, to: ToolState): boolean {
  return from === to || NEXT[from].includes(to);
}

export function isToolFinal(state: ToolState): boolean {
  return NEXT[state].length === 0;
}

/** True while the tool is still going or waiting on someone. */
export function isToolActive(state: ToolState): boolean {
  return !isToolFinal(state);
}

/** What each state is called to a person (and to a screen reader). */
export const toolStateLabel: Record<ToolState, string> = {
  pending: "Waiting",
  running: "Running",
  "awaiting-approval": "Needs your approval",
  approved: "Approved",
  denied: "Declined",
  done: "Done",
  failed: "Failed",
};

// --- Updating messages. Each returns a new message and never changes the one passed in.

/** Changes one tool part. An update that would move its state backwards is ignored. */
export function updateTool(message: ChatMessage, toolId: string, patch: Partial<Omit<ToolPart, "type" | "id">>): ChatMessage {
  let changed = false;
  const parts = message.parts.map((part) => {
    if (part.type !== "tool" || part.id !== toolId) return part;
    if (patch.state && !canMoveTool(part.state, patch.state)) return part;
    changed = true;
    return { ...part, ...patch };
  });
  return changed ? { ...message, parts } : message;
}

/** Adds streamed text to the end of the message, continuing the last text part if it is still streaming. */
export function appendText(message: ChatMessage, delta: string): ChatMessage {
  const last = message.parts[message.parts.length - 1];
  if (last && last.type === "text" && last.streaming) {
    return { ...message, status: "streaming", parts: [...message.parts.slice(0, -1), { ...last, text: last.text + delta }] };
  }
  return { ...message, status: "streaming", parts: [...message.parts, { type: "text", text: delta, streaming: true }] };
}

/** Marks the message and all of its streaming parts as finished. */
export function finishMessage(message: ChatMessage, status: Exclude<MessageStatus, "streaming"> = "complete"): ChatMessage {
  return {
    ...message,
    status,
    parts: message.parts.map((part) => ((part.type === "text" || part.type === "reasoning") && part.streaming ? { ...part, streaming: false } : part)),
  };
}

// --- Reading messages

/** A message's text parts, joined: for copying, search and the accessible name of a result. */
export function messageText(message: ChatMessage): string {
  return message.parts
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");
}

export type PartGroup = { kind: "part"; part: Exclude<MessagePart, ToolPart> } | { kind: "tools"; tools: ToolPart[] };

/** Splits parts into runs: each stretch of consecutive tool calls becomes one group. */
export function groupParts(parts: MessagePart[]): PartGroup[] {
  const groups: PartGroup[] = [];
  for (const part of parts) {
    if (part.type !== "tool") {
      groups.push({ kind: "part", part });
      continue;
    }
    const last = groups[groups.length - 1];
    if (last && last.kind === "tools") last.tools.push(part);
    else groups.push({ kind: "tools", tools: [part] });
  }
  return groups;
}

/** The tool that is waiting on a person, if any: the first one, since they answer in order. */
export function pendingApproval(message: ChatMessage): ToolPart | undefined {
  return message.parts.find((part): part is ToolPart => part.type === "tool" && part.state === "awaiting-approval");
}

/** "3.2 s", "1 min 5 s": how long a tool took, when it recorded both times. */
export function toolDuration(tool: Pick<ToolPart, "startedAt" | "endedAt">): string | undefined {
  if (!tool.startedAt || !tool.endedAt) return undefined;
  const ms = Date.parse(tool.endedAt) - Date.parse(tool.startedAt);
  if (!Number.isFinite(ms) || ms < 0) return undefined;
  if (ms < 950) return `${Math.max(1, Math.round(ms))} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)} s`;
  return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;
}

// --- The message box: attachments and the "+" menu

/** A file the person has added to a message that hasn't been sent yet. */
export interface PromptAttachment {
  id: string;
  name: string;
  mediaType?: string;
  size?: number;
  /** A preview address for images (a blob: or data: URL). Other files show as a chip. */
  url?: string;
  file?: File;
}

/** One entry in the "+" menu of the message box, next to the built-in "Add photos & files". */
export interface PromptAction {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  onSelect: () => void;
  isDisabled?: boolean;
}

let attachmentCount = 0;

/** Turns a chosen File into an attachment. Images get a preview address: call releaseAttachment when you drop it. */
export function fileToAttachment(file: File): PromptAttachment {
  const isImage = file.type.startsWith("image/");
  return { id: `att-${Date.now().toString(36)}-${attachmentCount++}`, name: file.name, mediaType: file.type || undefined, size: file.size, url: isImage ? URL.createObjectURL(file) : undefined, file };
}

/** Frees the preview address made by fileToAttachment. */
export function releaseAttachment(attachment: PromptAttachment): void {
  if (attachment.url?.startsWith("blob:")) URL.revokeObjectURL(attachment.url);
}

/** True for an image we may draw: it came from this device (blob: or data:), never from a remote address. */
export const isLocalImage = (item: { mediaType?: string; url?: string }): boolean =>
  !!item.url && (item.mediaType?.startsWith("image/") ?? /^data:image\//.test(item.url)) && /^(blob:|data:image\/)/.test(item.url);
