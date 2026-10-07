"use client";

import { createElement, useEffect, useId, useRef, useState } from "react";
import { apiKeyListDefaults, type ApiKeyListSpecProps } from "../generated/api-key-list.types";
import { ActionButton } from "../action-button/action-button";
import { Alert } from "../alert/alert";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { Dialog, DialogTrigger } from "../dialog/dialog";
import { EmptyState } from "../empty-state/empty-state";
import { ErrorState } from "../error-state/error-state";
import { ErrorSummary } from "../error-summary/error-summary";
import { Field } from "../form/field";
import { Form, FormSubmitButton } from "../form/form";
import { Skeleton } from "../skeleton/skeleton";
import { TextField } from "../text-field/text-field";
import { cx } from "../utils/cx";
import { formatDay } from "../utils/billing-format";
import { CopyIcon } from "../utils/icons";
import { resolvePermission } from "../utils/permissions";
import { StateBoundary } from "../utils/state-boundary";

export interface ApiKeyListProps extends ApiKeyListSpecProps {
  className?: string;
}

type Classes = ApiKeyListProps["classNames"];
type Scope = ApiKeyListProps["scopes"][number];
type Values = { name: string; scopes: string[] };

/**
 * API keys with a create dialog that shows the secret once, and a revoke that needs the key name typed. It creates
 * and revokes nothing itself, and never keeps a secret after the dialog closed.
 * UI permission is not security: the server must check again.
 */
export function ApiKeyList({
  keys,
  scopes,
  title = apiKeyListDefaults.title,
  headingLevel = apiKeyListDefaults.headingLevel,
  locale = apiKeyListDefaults.locale,
  state,
  onRetry,
  onCreate,
  onRevoke,
  permissions,
  classNames,
  className,
}: ApiKeyListProps) {
  const headingId = useId();
  const reasonId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const create = resolvePermission(permissions?.create);
  const level = Math.min(6, Math.max(2, Math.round(headingLevel)));
  const current = state ?? (keys.length === 0 ? "empty" : "ready");
  const labelOf = (id: string) => scopes.find((s) => s.id === id)?.label ?? id;

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={cx(
        "flex w-full flex-col overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] [box-shadow:var(--rd-elevation-raised)]",
        classNames?.root,
        className,
      )}
    >
      <div className={cx("flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rd-color-border-default)] p-4", classNames?.header)}>
        {createElement(
          `h${level}`,
          { id: headingId, ref: headingRef, tabIndex: -1, className: cx("text-base font-semibold text-[var(--rd-color-text-default)] outline-none", classNames?.title) },
          title,
        )}
        {create.isVisible &&
          (create.isDisabled ? (
            <Button
              aria-disabled="true"
              aria-describedby={create.reason ? reasonId : undefined}
              onPress={() => {}}
              className={cx("opacity-50 cursor-not-allowed", classNames?.createButton)}
            >
              Create key
            </Button>
          ) : (
            <DialogTrigger>
              <Button className={classNames?.createButton}>Create key</Button>
              <Dialog title="Create API key" size="md" isDismissable={false} className={classNames?.dialog}>
                {({ close }) => <CreateFlow scopes={scopes} onCreate={onCreate} close={close} classNames={classNames} />}
              </Dialog>
            </DialogTrigger>
          ))}
      </div>
      {create.isDisabled && create.reason && (
        <p id={reasonId} className={cx("border-b border-[var(--rd-color-border-default)] px-4 py-2 text-sm text-[var(--rd-color-text-muted)]", classNames?.reason)}>
          {create.reason}
        </p>
      )}

      <StateBoundary
        state={current}
        loading={
          <div className="flex flex-col gap-4 p-4">
            <Skeleton variant="text" width="35%" />
            <Skeleton variant="text" lines={2} />
          </div>
        }
        empty={
          <div className="p-4">
            <EmptyState size="sm" title="No API keys yet" description={create.isVisible ? "Create a key to call the API from your own code." : "Keys created for this workspace appear here."} />
          </div>
        }
        error={
          <div className="p-4">
            <ErrorState
              variant="inline"
              title="Couldn't load your API keys"
              actions={
                onRetry && (
                  <Button variant="secondary" onPress={onRetry}>
                    Try again
                  </Button>
                )
              }
            />
          </div>
        }
      >
        <ul aria-label={title} className={cx("flex flex-col", classNames?.list)}>
          {keys.map((key) => (
            <li
              key={key.id}
              className={cx(
                "flex flex-wrap items-start justify-between gap-3 border-b border-[var(--rd-color-border-default)] p-4 last:border-b-0",
                classNames?.item,
              )}
            >
              <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1.5">
                <p className={cx("text-sm font-medium text-[var(--rd-color-text-default)]", classNames?.name)}>{key.name}</p>
                <p className={cx("text-sm text-[var(--rd-color-text-muted)]", classNames?.prefix)}>
                  <span className="sr-only">Starts with </span>
                  <code className="rounded bg-[var(--rd-color-surface-subtle)] px-1.5 py-0.5 text-xs text-[var(--rd-color-text-default)]">{key.prefix}…</code>
                </p>
                <p className={cx("text-xs text-[var(--rd-color-text-muted)]", classNames?.meta)}>
                  Created {formatDay(key.createdAt, locale)} · {key.lastUsedAt ? `Last used ${formatDay(key.lastUsedAt, locale)}` : "Never used"}
                </p>
                {key.scopes.length > 0 && (
                  <ul aria-label={`Scopes of ${key.name}`} className={cx("flex flex-wrap gap-1.5", classNames?.scopes)}>
                    {key.scopes.map((id) => (
                      <li key={id}>
                        <Badge size="sm" className={classNames?.scope}>
                          {labelOf(id)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <ActionButton
                variant="danger"
                size="sm"
                permission={permissions?.revoke}
                onAction={() => onRevoke(key)}
                onSuccess={() => {
                  setAnnouncement(`Key ${key.name} revoked`);
                  // After the dialog has closed and given focus back, which would otherwise win.
                  setTimeout(() => headingRef.current?.focus(), 60);
                }}
                confirm={{
                  title: `Revoke ${key.name}?`,
                  description: "Anything that uses this key stops working at once. This cannot be undone.",
                  confirmLabel: "Revoke key",
                  confirmText: key.name,
                }}
                className={classNames?.revokeButton}
              >
                Revoke<span className="sr-only"> {key.name}</span>
              </ActionButton>
            </li>
          ))}
        </ul>
      </StateBoundary>
      <span role="status" className={cx("sr-only", classNames?.status)}>
        {announcement}
      </span>
    </div>
  );
}

interface CreateFlowProps {
  scopes: Scope[];
  onCreate: ApiKeyListProps["onCreate"];
  close: () => void;
  classNames: Classes;
}

/** The form, then the secret. The secret lives only in this component, which is gone when the dialog closes. */
function CreateFlow({ scopes, onCreate, close, classNames }: CreateFlowProps) {
  const [secret, setSecret] = useState<string | null>(null);
  if (secret !== null) return <Secret secret={secret} close={close} classNames={classNames} />;
  return (
    <Form<Values>
      defaultValues={{ name: "", scopes: [] }}
      errorMessage="Couldn't create the key. Try again."
      onSubmit={async (values) => {
        const result = await onCreate(values.name.trim(), values.scopes);
        setSecret(result.secret);
      }}
      className={cx("gap-4", classNames?.form)}
    >
      <ErrorSummary />
      <Field<string> name="name" label="Name" isRequired>
        {(f) => <TextField {...f.inputProps} label="Name" description="Something that tells you where the key is used." autoComplete="off" autoFocus />}
      </Field>
      <Field<string[]>
        name="scopes"
        label="Scopes"
        validate={(value) => (Array.isArray(value) && value.length > 0 ? null : "Choose at least one scope.")}
      >
        {(f) => <ScopeChoices scopes={scopes} value={f.value ?? []} onChange={f.setValue} error={f.errorMessage} />}
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onPress={close}>
          Cancel
        </Button>
        <FormSubmitButton>Create key</FormSubmitButton>
      </div>
    </Form>
  );
}

function ScopeChoices({ scopes, value, onChange, error }: { scopes: Scope[]; value: string[]; onChange: (next: string[]) => void; error?: string }) {
  const labelId = useId();
  const errorId = useId();
  const prefix = useId();
  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={error ? errorId : undefined} className="flex flex-col gap-2">
      <span id={labelId} className="text-sm font-medium text-[var(--rd-color-text-default)]">
        Scopes
      </span>
      {scopes.map((scope) => (
        <div key={scope.id} className="flex flex-col gap-0.5">
          <Checkbox
            isSelected={value.includes(scope.id)}
            onChange={(on) => onChange(on ? [...value, scope.id] : value.filter((id) => id !== scope.id))}
            aria-describedby={scope.description ? `${prefix}-${scope.id}` : undefined}
          >
            {scope.label}
          </Checkbox>
          {scope.description && (
            <p id={`${prefix}-${scope.id}`} className="ps-6 text-xs text-[var(--rd-color-text-muted)]">
              {scope.description}
            </p>
          )}
        </div>
      ))}
      {error && (
        <p id={errorId} className="text-xs text-[var(--rd-color-feedback-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

function Secret({ secret, close, classNames }: { secret: string; close: () => void; classNames: Classes }) {
  const [copied, setCopied] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied("Copied");
    } catch {
      setCopied("Could not copy. Select the key and copy it yourself.");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(""), 4000);
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="warning" title="Copy your key now" className={classNames?.warning}>
        You will not see it again. If you lose it, revoke it and create a new one.
      </Alert>
      <TextField label="Secret key" value={secret} isReadOnly autoComplete="off" className={classNames?.secret} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span role="status" className="me-auto text-sm text-[var(--rd-color-text-muted)]">
          {copied}
        </span>
        <Button variant="secondary" autoFocus onPress={() => void copy()} className={classNames?.copyButton}>
          <CopyIcon />
          Copy key
        </Button>
        <Button onPress={close}>Done</Button>
      </div>
    </div>
  );
}
