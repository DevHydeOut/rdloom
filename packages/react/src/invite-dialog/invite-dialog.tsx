"use client";

import { useEffect, useRef, useState } from "react";
import { inviteDialogDefaults, type InviteDialogSpecProps } from "../generated/invite-dialog.types";
import { Dialog } from "../dialog/dialog";
import { ErrorSummary } from "../error-summary/error-summary";
import { FieldArray } from "../field-array/field-array";
import { Field } from "../form/field";
import { Form, useFormValues, type SubmitResult } from "../form/form";
import { Select, SelectItem } from "../select/select";
import { Switch } from "../switch/switch";
import { TextField } from "../text-field/text-field";
import { cx } from "../utils/cx";
import { resolvePermission, type ResolvedPermission } from "../utils/permissions";
import { PickStep, RoleStep, StepCounters, type ListFlowState } from "./invite-list";
import { Footer, people as countPeople, emailShape, type InviteClassNames, type InvitePerson } from "./invite-parts";
import { SearchPicker, type PickedPerson } from "./invite-search";

export interface InviteDialogProps extends InviteDialogSpecProps {
  className?: string;
}

type Invite = { email: string; role: string };
type Values = { invites: Invite[]; message: string };

const defaultSubmitLabel = (count: number) => (count === 1 ? "Send invitation" : `Send ${count} invitations`);
const defaultSuccessMessage = (count: number) => (count === 1 ? "1 invitation sent" : `${count} invitations sent`);

const freshFlow: ListFlowState = { step: 1, picked: [], roleOf: {} };

/**
 * A dialog for inviting people: typed emails, a search of your directory, or a two-step pick from a list.
 * It checks what was entered, asks your onInvite to send, and closes when that worked. It sends nothing itself.
 * UI permission is not security: the server must check again.
 */
export function InviteDialog({
  variant = inviteDialogDefaults.variant,
  roles,
  defaultRole,
  existingEmails,
  defaultInvites,
  people = [],
  onSearch,
  maxVisibleRows = inviteDialogDefaults.maxVisibleRows,
  maxInvites = inviteDialogDefaults.maxInvites,
  title,
  description,
  allowMessage = inviteDialogDefaults.allowMessage,
  messageLabel = inviteDialogDefaults.messageLabel,
  submitLabel = defaultSubmitLabel,
  successMessage = defaultSuccessMessage,
  onInvite,
  onCancel,
  onOpenChange,
  isOpen,
  permissions,
  classNames,
}: InviteDialogProps) {
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(0);
  const [flow, setFlow] = useState<ListFlowState>(freshFlow);
  const access = resolvePermission(permissions?.invite);
  if (!access.isVisible) return null;

  const startRole = defaultRole ?? roles[0]?.id ?? "";
  const known = new Set((existingEmails ?? []).map((e) => e.trim().toLowerCase()));
  const isList = variant === "list";
  const directory = people.filter((p) => !known.has(p.email.trim().toLowerCase()));
  const heading = isList ? (flow.step === 1 ? (title ?? "Select users") : "Give user role") : (title ?? "Invite people");

  return (
    <>
      <Dialog
        title={heading}
        description={isList ? undefined : description}
        size={isList ? "md" : "lg"}
        isDismissable={false}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        headerEnd={isList ? <StepCounters step={flow.step} picked={flow.picked.length} total={directory.length} /> : undefined}
        className={cx("max-h-[90dvh] overflow-hidden", classNames?.dialog)}
      >
        {({ close }) => (
          <InviteForm
            variant={variant}
            roles={roles}
            startRole={startRole}
            known={known}
            defaultInvites={defaultInvites}
            directory={directory}
            onSearch={onSearch}
            maxInvites={maxInvites}
            maxVisibleRows={maxVisibleRows}
            allowMessage={allowMessage && !isList}
            messageLabel={messageLabel}
            submitLabel={submitLabel}
            access={access}
            classNames={classNames}
            flow={flow}
            setFlow={setFlow}
            onInvite={onInvite}
            onCancel={() => {
              onCancel?.();
              onOpenChange?.(false);
              close();
            }}
            onEscape={() => onCancel?.()}
            onSent={(count) => {
              setStatus(successMessage(count));
              setSent((n) => n + 1);
              onOpenChange?.(false);
              close();
            }}
          />
        )}
      </Dialog>
      {/* Outside the dialog, so it is still there to be read after the dialog has closed. */}
      <span role="status" aria-live="polite" className={cx("sr-only", classNames?.status)}>
        {status}
        {sent % 2 === 1 ? "" : " "}
      </span>
    </>
  );
}

interface InviteFormProps {
  variant: NonNullable<InviteDialogProps["variant"]>;
  roles: InviteDialogProps["roles"];
  startRole: string;
  known: Set<string>;
  defaultInvites: InviteDialogProps["defaultInvites"];
  directory: InvitePerson[];
  onSearch: InviteDialogProps["onSearch"];
  maxInvites: number;
  maxVisibleRows: number;
  allowMessage: boolean;
  messageLabel: string;
  submitLabel: (count: number) => string;
  access: ResolvedPermission;
  classNames: InviteClassNames | undefined;
  flow: ListFlowState;
  setFlow: (next: ListFlowState | ((current: ListFlowState) => ListFlowState)) => void;
  onInvite: InviteDialogProps["onInvite"];
  onCancel: () => void;
  onEscape: () => void;
  onSent: (count: number) => void;
}

function InviteForm({
  variant,
  roles,
  startRole,
  known,
  defaultInvites,
  directory,
  onSearch,
  maxInvites,
  maxVisibleRows,
  allowMessage,
  messageLabel,
  submitLabel,
  access,
  classNames,
  flow,
  setFlow,
  onInvite,
  onCancel,
  onEscape,
  onSent,
}: InviteFormProps) {
  const [withMessage, setWithMessage] = useState(false);
  const [picked, setPicked] = useState<PickedPerson[]>([]);
  const [stepNote, setStepNote] = useState("");
  const shell = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  // Each time the list variant changes step, focus goes to the new heading, which is also announced.
  useEffect(() => {
    if (variant !== "list") return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const heading = shell.current?.closest('[role="dialog"], [role="alertdialog"]')?.querySelector<HTMLElement>("h1, h2, h3");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus();
      setStepNote(`Step ${flow.step} of 2: ${heading.textContent ?? ""}`);
    }
  }, [flow.step, variant]);

  // A closed dialog starts over the next time it opens.
  useEffect(() => () => setFlow(freshFlow), [setFlow]);

  const submit = async (values: Values): Promise<void | SubmitResult> => {
    if (!access.isAllowed) return { formError: access.reason ?? "You cannot invite people." };
    let invites: Array<Invite & { person?: InvitePerson }>;
    if (variant === "emails") invites = values.invites.map((row) => ({ email: row.email.trim(), role: row.role }));
    else if (variant === "search") invites = picked.map((p) => ({ email: p.email, role: p.role, ...(p.person ? { person: p.person } : {}) }));
    else
      invites = directory
        .filter((p) => flow.picked.includes(p.id))
        .map((p) => ({ email: p.email, role: flow.roleOf[p.id] ?? startRole, person: p }));
    if (invites.length === 0) return { formError: "Choose at least one person to invite." };
    const message = withMessage && allowMessage ? values.message?.trim() : undefined;
    const result = await onInvite(invites, { message: message || undefined });
    if (result && (result.formError || (result.fieldErrors && Object.keys(result.fieldErrors).length))) {
      // Only the typed rows have a field to show an error on; elsewhere the errors read as one message.
      if (variant === "emails") return result;
      return { formError: [result.formError, ...Object.values(result.fieldErrors ?? {})].filter(Boolean).join(" ") };
    }
    onSent(invites.length);
  };

  const isList = variant === "list";
  return (
    <Form<Values>
      defaultValues={{
        invites: defaultInvites?.length ? defaultInvites.map((i) => ({ email: i.email, role: i.role ?? startRole })) : [{ email: "", role: startRole }],
        message: "",
      }}
      onSubmit={submit}
      className={cx("min-h-0 flex-1 gap-4", classNames?.form)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) onEscape();
      }}
    >
      <div ref={shell} className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 py-1 -my-1">
        <ErrorSummary />
        {variant === "emails" && <EmailRows roles={roles} startRole={startRole} known={known} maxInvites={maxInvites} maxVisibleRows={maxVisibleRows} classNames={classNames} />}
        {variant === "search" && (
          <SearchPicker
            directory={directory}
            onSearch={onSearch}
            roles={roles}
            picked={picked}
            onPicked={setPicked}
            startRole={startRole}
            known={known}
            maxInvites={maxInvites}
            maxVisibleRows={maxVisibleRows}
            classNames={classNames}
          />
        )}
        {isList && flow.step === 1 && (
          <PickStep
            directory={directory}
            picked={flow.picked}
            onPicked={(ids) => setFlow((f) => ({ ...f, picked: ids }))}
            maxVisibleRows={Math.max(maxVisibleRows, 5)}
            classNames={classNames}
          />
        )}
        {isList && flow.step === 2 && (
          <RoleStep
            directory={directory}
            picked={flow.picked}
            roleOf={flow.roleOf}
            roles={roles}
            startRole={startRole}
            onRole={(id, role) => setFlow((f) => ({ ...f, roleOf: { ...f.roleOf, [id]: role } }))}
            maxVisibleRows={Math.max(maxVisibleRows, 5)}
            classNames={classNames}
          />
        )}
        {allowMessage && <MessageToggle on={withMessage} onChange={setWithMessage} label={messageLabel} classNames={classNames} />}
        <div role="status" aria-live="polite" className="sr-only">
          {stepNote}
        </div>
      </div>
      {variant === "emails" && <EmailsFooter access={access} classNames={classNames} submitLabel={submitLabel} onCancel={onCancel} />}
      {variant === "search" && (
        <Footer
          access={access}
          classNames={classNames}
          secondaryLabel="Cancel"
          onSecondary={onCancel}
          primary={{ kind: "submit", label: picked.length === 0 ? "Send invitations" : submitLabel(picked.length), isDisabled: picked.length === 0 }}
        />
      )}
      {isList && flow.step === 1 && (
        <Footer
          access={access}
          classNames={classNames}
          equal
          secondaryLabel="Cancel"
          onSecondary={onCancel}
          primary={{ kind: "button", label: "Next", isDisabled: flow.picked.length === 0, onPress: () => setFlow((f) => ({ ...f, step: 2 })) }}
        />
      )}
      {isList && flow.step === 2 && (
        <Footer
          access={access}
          classNames={classNames}
          equal
          secondaryLabel="Prev"
          onSecondary={() => setFlow((f) => ({ ...f, step: 1 }))}
          primary={{ kind: "submit", label: "Add" }}
        />
      )}
    </Form>
  );
}

function EmailsFooter({
  access,
  classNames,
  submitLabel,
  onCancel,
}: {
  access: ResolvedPermission;
  classNames: InviteClassNames | undefined;
  submitLabel: (count: number) => string;
  onCancel: () => void;
}) {
  const count = useFormValues<Values, number>((v) => v.invites.length);
  return (
    <Footer
      access={access}
      classNames={classNames}
      start={<span className={classNames?.counter}>{countPeople(count)}</span>}
      secondaryLabel="Cancel"
      onSecondary={onCancel}
      primary={{ kind: "submit", label: submitLabel(count) }}
    />
  );
}

function EmailRows({
  roles,
  startRole,
  known,
  maxInvites,
  maxVisibleRows,
  classNames,
}: {
  roles: InviteDialogProps["roles"];
  startRole: string;
  known: Set<string>;
  maxInvites: number;
  maxVisibleRows: number;
  classNames: InviteClassNames | undefined;
}) {
  return (
    <>
      <FieldArray
        name="invites"
        label="People to invite"
        itemLabel="Invitation"
        addLabel="Add another"
        emptyText="No one to invite yet. Add the first person."
        defaultRow={{ email: "", role: startRole }}
        minRows={1}
        maxRows={maxInvites}
        density="compact"
        allowReorder={false}
        maxVisibleRows={maxVisibleRows}
        className={classNames?.list}
        messages={{ maxReached: (max) => `You can invite up to ${max} people at once.` }}
      >
        {(row) => {
          const n = row.index + 1;
          return (
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_7.5rem] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
              <Field<string>
                name={row.name("email")}
                label={`Email ${n}`}
                isRequired
                validate={(value, all) => {
                  const email = String(value ?? "").trim();
                  if (!emailShape.test(email)) return "Enter a valid email address.";
                  const lower = email.toLowerCase();
                  if (known.has(lower)) return `${email} is already a member.`;
                  const rows = ((all as Values).invites ?? []) as Invite[];
                  if (rows.findIndex((r) => r.email.trim().toLowerCase() === lower) !== row.index) return `${email} is already in this list.`;
                }}
              >
                {(f) => (
                  <TextField
                    {...f.inputProps}
                    label={`Email ${n}`}
                    size="sm"
                    type="email"
                    autoComplete="off"
                    placeholder="name@example.com"
                    autoFocus={row.index === 0}
                    className="[&>:first-child]:sr-only"
                  />
                )}
              </Field>
              <Field<string> name={row.name("role")} label={`Role ${n}`} isRequired>
                {(f) => (
                  <Select {...f.selectProps} label={`Role ${n}`} size="sm" className="[&>:first-child]:sr-only">
                    {roles.map((role) => (
                      <SelectItem key={role.id} id={role.id} textValue={role.label}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          );
        }}
      </FieldArray>
      <RoleHint roles={roles} />
    </>
  );
}

/** One hint for the whole list, instead of a description under every role. */
function RoleHint({ roles }: { roles: InviteDialogProps["roles"] }) {
  const described = roles.filter((r) => r.description);
  if (described.length === 0) return null;
  return (
    <p className="-mt-1 text-xs text-[var(--rd-color-text-muted)]">
      {described.map((r, i) => (
        <span key={r.id}>
          {i > 0 && " · "}
          <span className="font-medium text-[var(--rd-color-text-default)]">{r.label}</span> {r.description}
        </span>
      ))}
    </p>
  );
}

function MessageToggle({
  on,
  onChange,
  label,
  classNames,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  label: string;
  classNames: InviteClassNames | undefined;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Switch isSelected={on} onChange={onChange} size="sm" className={classNames?.toggle}>
        Add a message
      </Switch>
      {on && (
        <Field<string> name="message" label={label}>
          {(f) => <TextField {...f.inputProps} label={label} multiline autoFocus className={classNames?.message} />}
        </Field>
      )}
    </div>
  );
}
