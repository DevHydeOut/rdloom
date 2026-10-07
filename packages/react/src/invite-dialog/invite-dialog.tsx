"use client";

import { useId, useState } from "react";
import { inviteDialogDefaults, type InviteDialogSpecProps } from "../generated/invite-dialog.types";
import { Button } from "../button/button";
import { Dialog } from "../dialog/dialog";
import { FieldArray } from "../field-array/field-array";
import { ErrorSummary } from "../error-summary/error-summary";
import { Field } from "../form/field";
import { Form, FormSubmitButton, useFormState, useFormValues, type SubmitResult } from "../form/form";
import { Select, SelectItem } from "../select/select";
import { TextField } from "../text-field/text-field";
import { cx } from "../utils/cx";
import { resolvePermission } from "../utils/permissions";

export interface InviteDialogProps extends InviteDialogSpecProps {
  className?: string;
}

type Invite = { email: string; role: string };
type Values = { invites: Invite[]; message: string };

// A plain shape check; whether the address really exists is for your server to find out.
const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultSubmitLabel = (count: number) => (count === 1 ? "Send invitation" : `Send ${count} invitations`);
const defaultSuccessMessage = (count: number) => (count === 1 ? "1 invitation sent" : `${count} invitations sent`);

/**
 * A dialog for inviting people by email, one or many. It checks the rows, asks your onInvite to send,
 * and closes when that worked. It sends nothing itself. UI permission is not security: the server must check again.
 */
export function InviteDialog({
  roles,
  defaultRole,
  existingEmails,
  maxInvites = inviteDialogDefaults.maxInvites,
  title = "Invite people",
  description,
  showMessage = inviteDialogDefaults.showMessage,
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
  const access = resolvePermission(permissions?.invite);
  if (!access.isVisible) return null;

  const startRole = defaultRole ?? roles[0]?.id ?? "";
  const known = new Set((existingEmails ?? []).map((e) => e.trim().toLowerCase()));

  return (
    <>
      <Dialog
        title={title}
        description={description}
        size="lg"
        isDismissable={false}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className={classNames?.dialog}
      >
        {({ close }) => (
          <InviteForm
            roles={roles}
            startRole={startRole}
            known={known}
            maxInvites={maxInvites}
            showMessage={showMessage}
            messageLabel={messageLabel}
            submitLabel={submitLabel}
            access={access}
            classNames={classNames}
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
  roles: InviteDialogProps["roles"];
  startRole: string;
  known: Set<string>;
  maxInvites: number;
  showMessage: boolean;
  messageLabel: string;
  submitLabel: (count: number) => string;
  access: ReturnType<typeof resolvePermission>;
  classNames: InviteDialogProps["classNames"];
  onInvite: InviteDialogProps["onInvite"];
  onCancel: () => void;
  onEscape: () => void;
  onSent: (count: number) => void;
}

function InviteForm({ roles, startRole, known, maxInvites, showMessage, messageLabel, submitLabel, access, classNames, onInvite, onCancel, onEscape, onSent }: InviteFormProps) {
  const submit = async (values: Values): Promise<void | SubmitResult> => {
    if (!access.isAllowed) return { formError: access.reason ?? "You cannot invite people." };
    const invites = values.invites.map((row) => ({ email: row.email.trim(), role: row.role }));
    const message = values.message?.trim();
    const result = await onInvite(invites, { message: message || undefined });
    if (result && (result.formError || (result.fieldErrors && Object.keys(result.fieldErrors).length))) return result;
    onSent(invites.length);
  };

  return (
    <Form<Values>
      defaultValues={{ invites: [{ email: "", role: startRole }], message: "" }}
      onSubmit={submit}
      className={cx("gap-4", classNames?.form)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) onEscape();
      }}
    >
      <ErrorSummary />
      <FieldArray
        name="invites"
        label="People to invite"
        itemLabel="Invitation"
        addLabel="Add another"
        emptyText="No one to invite yet. Add the first person."
        defaultRow={{ email: "", role: startRole }}
        minRows={1}
        maxRows={maxInvites}
        className={classNames?.list}
        messages={{ maxReached: (max) => `You can invite up to ${max} people at once.` }}
      >
        {(row) => (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <Field<string>
              name={row.name("email")}
              label="Email"
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
              {(f) => <TextField {...f.inputProps} label="Email" type="email" autoComplete="off" autoFocus={row.index === 0} />}
            </Field>
            <RoleSelect name={row.name("role")} roles={roles} />
          </div>
        )}
      </FieldArray>
      {showMessage && (
        <Field<string> name="message" label={messageLabel}>
          {(f) => <TextField {...f.inputProps} label={messageLabel} multiline className={classNames?.message} />}
        </Field>
      )}
      <Actions access={access} classNames={classNames} submitLabel={submitLabel} onCancel={onCancel} />
    </Form>
  );
}

function RoleSelect({ name, roles }: { name: string; roles: InviteDialogProps["roles"] }) {
  return (
    <Field<string> name={name} label="Role" isRequired>
      {(f) => (
        <Select
          {...f.selectProps}
          label="Role"
          description={roles.find((r) => r.id === f.value)?.description}
        >
          {roles.map((role) => (
            <SelectItem key={role.id} id={role.id}>
              {role.label}
            </SelectItem>
          ))}
        </Select>
      )}
    </Field>
  );
}

function Actions({
  access,
  classNames,
  submitLabel,
  onCancel,
}: {
  access: ReturnType<typeof resolvePermission>;
  classNames: InviteDialogProps["classNames"];
  submitLabel: (count: number) => string;
  onCancel: () => void;
}) {
  const { isPending } = useFormState();
  const count = useFormValues<Values, number>((v) => v.invites.length);
  const label = submitLabel(count);
  const reasonId = useId();
  return (
    <>
      {access.isDisabled && access.reason && (
        <p id={reasonId} className={cx("text-sm text-[var(--rd-color-text-muted)]", classNames?.reason)}>
          {access.reason}
        </p>
      )}
      <div className={cx("flex justify-end gap-2", classNames?.actions)}>
        <Button type="button" variant="secondary" isDisabled={isPending} onPress={onCancel} className={classNames?.cancelButton}>
          Cancel
        </Button>
        {access.isDisabled ? (
          // Looks disabled but stays in the tab order, so the reason can be reached.
          <Button
            type="button"
            aria-disabled="true"
            aria-describedby={access.reason ? reasonId : undefined}
            onPress={() => {}}
            className={cx("opacity-50 cursor-not-allowed", classNames?.submitButton)}
          >
            {label}
          </Button>
        ) : (
          <FormSubmitButton className={classNames?.submitButton}>{label}</FormSubmitButton>
        )}
      </div>
    </>
  );
}
