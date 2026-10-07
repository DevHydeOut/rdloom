"use client";

import { createElement, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { userFormDefaults, type UserFormSpecProps } from "../generated/user-form.types";
import { ActionButton } from "../action-button/action-button";
import { AlertDialog } from "../alert-dialog/alert-dialog";
import { Button } from "../button/button";
import { ErrorSummary } from "../error-summary/error-summary";
import { Field } from "../form/field";
import { Form, FormSubmitButton, useFormState, useFormValues, type SubmitResult } from "../form/form";
import { Select, SelectItem } from "../select/select";
import { Switch } from "../switch/switch";
import { TextField } from "../text-field/text-field";
import { cx } from "../utils/cx";
import { CheckIcon } from "../utils/icons";
import { resolvePermission, type PermissionValue, type ResolvedPermission } from "../utils/permissions";

export interface UserFormProps extends UserFormSpecProps {
  className?: string;
}

type UserValues = NonNullable<Parameters<UserFormProps["onSubmit"]>[0]>;
// Inside the form the team is always a string, so a Select can show "No team".
type Values = Omit<UserValues, "team"> & { team: string };
type Choice = { id: string; label: string; description?: string };

const NO_TEAM = "none";
const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates or edits a user. Save waits for a change, Cancel asks before discarding one, and the danger zone
 * holds Suspend and Delete user behind a confirmation. It saves nothing itself.
 * UI permission is not security: the server must check again.
 */
export function UserForm({
  mode = userFormDefaults.mode,
  defaultValues,
  roles,
  teams,
  title,
  headingLevel = userFormDefaults.headingLevel,
  layout = userFormDefaults.layout,
  submitLabel,
  successMessage = userFormDefaults.successMessage,
  dangerZone,
  onSubmit,
  onCancel,
  onDelete,
  onSuspend,
  permissions,
  classNames,
  className,
}: UserFormProps) {
  const edit = resolvePermission(permissions?.edit);
  const changeRole = resolvePermission(permissions?.changeRole);
  const del = resolvePermission(permissions?.delete);

  const initial: Values = {
    name: defaultValues?.name ?? "",
    email: defaultValues?.email ?? "",
    role: defaultValues?.role ?? "",
    status: defaultValues?.status ?? "active",
    team: defaultValues?.team ?? NO_TEAM,
  };
  const [initialValues] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [discardOpen, setDiscardOpen] = useState(false);
  const dirtyRef = useRef(false);
  const headingId = useId();
  if (!edit.isVisible) return null;

  const isEdit = mode === "edit";
  const Heading = `h${Math.min(6, Math.max(1, Math.round(headingLevel)))}` as "h2";
  const hasDanger = isEdit && ((Boolean(onDelete) && del.isVisible) || Boolean(onSuspend) || Boolean(dangerZone));

  const submit = async (values: Values): Promise<void | SubmitResult> => {
    if (!edit.isAllowed) return { formError: edit.reason ?? "You cannot change this user." };
    const result = await onSubmit({ ...values, team: values.team === NO_TEAM ? null : values.team });
    if (result && (result.formError || (result.fieldErrors && Object.keys(result.fieldErrors).length))) return result;
    setBaseline(JSON.stringify(values));
  };

  const askToCancel = () => {
    if (dirtyRef.current) setDiscardOpen(true);
    else onCancel?.();
  };

  return (
    <div
      className={cx(
        "flex w-full flex-col gap-6",
        layout === "card" &&
          "rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-6 [box-shadow:var(--rd-elevation-raised)]",
        classNames?.root,
        className,
      )}
    >
      {title && (
        <div className={cx("flex flex-col gap-1", classNames?.header)}>
          {createElement(Heading, { id: headingId, className: cx("text-lg font-semibold text-[var(--rd-color-text-default)]", classNames?.title) }, title)}
        </div>
      )}
      <Form<Values>
        defaultValues={initialValues}
        onSubmit={submit}
        aria-labelledby={title ? headingId : undefined}
        aria-label={title ? undefined : isEdit ? "Edit user" : "Create user"}
        className={cx("gap-5", classNames?.form)}
        onKeyDown={(event) => {
          // A Sheet or page around the form would close on Escape and lose the changes; ask first.
          if (event.key === "Escape" && !event.defaultPrevented && dirtyRef.current) {
            event.preventDefault();
            event.stopPropagation();
            setDiscardOpen(true);
          }
        }}
      >
        <DirtyTracker baseline={baseline} dirtyRef={dirtyRef} />
        <ErrorSummary />
        <div className={cx("flex flex-col gap-4", classNames?.fields)}>
          <Field<string> name="name" label="Name" isRequired>
            {(f) => <TextField {...f.inputProps} label="Name" autoComplete="off" isReadOnly={!edit.isAllowed} description={edit.isAllowed ? undefined : edit.reason} />}
          </Field>
          <Field<string>
            name="email"
            label="Email"
            isRequired={!isEdit}
            validate={(value) => (value && !emailShape.test(String(value).trim()) ? "Enter a valid email address." : null)}
          >
            {(f) => (
              <TextField
                {...f.inputProps}
                label="Email"
                type="email"
                autoComplete="off"
                isReadOnly={isEdit || !edit.isAllowed}
                isRequired={isEdit ? undefined : f.inputProps.isRequired}
                description={isEdit ? "Email cannot be changed here." : edit.isAllowed ? undefined : edit.reason}
              />
            )}
          </Field>
          {changeRole.isVisible && (
            <ChoiceField
              name="role"
              label="Role"
              items={roles}
              isRequired
              readOnly={!edit.isAllowed || !changeRole.isAllowed}
              reason={!edit.isAllowed ? edit.reason : changeRole.reason}
              showDescription
            />
          )}
          <StatusSwitch readOnly={!edit.isAllowed} reason={edit.reason} />
          {teams && teams.length > 0 && (
            <ChoiceField
              name="team"
              label="Team"
              items={[{ id: NO_TEAM, label: "No team" }, ...teams]}
              readOnly={!edit.isAllowed}
              reason={edit.reason}
            />
          )}
        </div>
        <Actions
          edit={edit}
          label={submitLabel ?? (isEdit ? "Save changes" : "Create user")}
          baseline={baseline}
          successMessage={successMessage}
          classNames={classNames}
          onCancel={askToCancel}
        />
      </Form>
      {hasDanger && (
        <DangerZone
          classNames={classNames}
          onDelete={onDelete}
          onSuspend={onSuspend}
          deletePermission={permissions?.delete}
          editPermission={permissions?.edit}
          extra={dangerZone}
        />
      )}
      <AlertDialog
        tone="danger"
        title="Discard changes?"
        description="You have unsaved changes. If you leave now, they will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        isOpen={discardOpen}
        onOpenChange={setDiscardOpen}
        onConfirm={() => onCancel?.()}
      />
    </div>
  );
}

/** Tells the outside whether the form differs from what was last saved. */
function DirtyTracker({ baseline, dirtyRef }: { baseline: string; dirtyRef: { current: boolean } }) {
  const dirty = useFormValues<Values, boolean>((v) => JSON.stringify(v) !== baseline);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty, dirtyRef]);
  return null;
}

interface ChoiceFieldProps {
  name: string;
  label: string;
  items: Choice[];
  isRequired?: boolean;
  readOnly: boolean;
  reason?: string;
  showDescription?: boolean;
}

/** A Select, or when the person may not change it a read-only field that can still be reached and says why. */
function ChoiceField({ name, label, items, isRequired, readOnly, reason, showDescription }: ChoiceFieldProps) {
  return (
    <Field<string> name={name} label={label} isRequired={isRequired && !readOnly}>
      {(f) => {
        const chosen = items.find((item) => item.id === f.value);
        const description = readOnly ? reason : showDescription ? chosen?.description : undefined;
        if (readOnly) {
          return <TextField name={name} label={label} value={chosen?.label ?? ""} isReadOnly description={description} />;
        }
        return (
          <Select {...f.selectProps} label={label} description={description}>
            {items.map((item) => (
              <SelectItem key={item.id} id={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </Select>
        );
      }}
    </Field>
  );
}

function StatusSwitch({ readOnly, reason }: { readOnly: boolean; reason?: string }) {
  const hintId = useId();
  return (
    <Field<string> name="status" label="Status">
      {(f) => (
        <div className="flex flex-col gap-1">
          <Switch
            name="status"
            isSelected={f.value !== "suspended"}
            onChange={(on) => f.setValue(on ? "active" : "suspended")}
            onBlur={f.onBlur}
            isReadOnly={readOnly}
            aria-describedby={hintId}
          >
            Active
          </Switch>
          <p id={hintId} className="text-xs text-[var(--rd-color-text-muted)]">
            {readOnly && reason ? reason : "Suspended users cannot sign in."}
          </p>
        </div>
      )}
    </Field>
  );
}

interface ActionsProps {
  edit: ResolvedPermission;
  label: string;
  baseline: string;
  successMessage: string;
  classNames: UserFormProps["classNames"];
  onCancel: () => void;
}

function Actions({ edit, label, baseline, successMessage, classNames, onCancel }: ActionsProps) {
  const { state, isPending } = useFormState();
  const dirty = useFormValues<Values, boolean>((v) => JSON.stringify(v) !== baseline);
  const reasonId = useId();
  return (
    <>
      {state === "success" && !dirty && (
        <p className={cx("flex items-center gap-2 text-sm text-[var(--rd-color-feedback-success)]", classNames?.status)}>
          <CheckIcon className="size-4 shrink-0" />
          {successMessage}
        </p>
      )}
      {edit.isDisabled && edit.reason && (
        <p id={reasonId} className="text-sm text-[var(--rd-color-text-muted)]">
          {edit.reason}
        </p>
      )}
      <div className={cx("flex justify-end gap-2", classNames?.actions)}>
        <Button type="button" variant="secondary" isDisabled={isPending} onPress={onCancel} className={classNames?.cancelButton}>
          Cancel
        </Button>
        {edit.isDisabled ? (
          // Looks disabled but stays in the tab order, so the reason can be reached.
          <Button
            type="button"
            aria-disabled="true"
            aria-describedby={edit.reason ? reasonId : undefined}
            onPress={() => {}}
            className={cx("opacity-50 cursor-not-allowed", classNames?.saveButton)}
          >
            {label}
          </Button>
        ) : (
          <FormSubmitButton isDisabled={!dirty} className={classNames?.saveButton}>
            {label}
          </FormSubmitButton>
        )}
      </div>
    </>
  );
}

interface DangerZoneProps {
  classNames: UserFormProps["classNames"];
  onDelete: UserFormProps["onDelete"];
  onSuspend: UserFormProps["onSuspend"];
  deletePermission?: PermissionValue;
  editPermission?: PermissionValue;
  extra?: ReactNode;
}

function DangerZone({ classNames, onDelete, onSuspend, deletePermission, editPermission, extra }: DangerZoneProps) {
  const headingId = useId();
  return (
    <section
      role="group"
      aria-labelledby={headingId}
      className={cx(
        "flex flex-col gap-3 border-t border-[var(--rd-color-border-default)] pt-5",
        classNames?.dangerZone,
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 id={headingId} className="text-sm font-semibold text-[var(--rd-color-feedback-danger)]">
          Danger zone
        </h3>
        <p className="text-sm text-[var(--rd-color-text-muted)]">These actions affect this person&apos;s access to everything.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onSuspend && (
          <ActionButton
            variant="secondary"
            permission={editPermission}
            onAction={onSuspend}
            confirm={{
              title: "Suspend this user?",
              description: "They are signed out and cannot sign in until you make them active again.",
              confirmLabel: "Suspend",
            }}
          >
            Suspend
          </ActionButton>
        )}
        {onDelete && (
          <ActionButton
            variant="danger"
            permission={deletePermission}
            onAction={onDelete}
            confirm={{ title: "Delete this user?", description: "This removes the user for good. It cannot be undone.", confirmLabel: "Delete user" }}
          >
            Delete user
          </ActionButton>
        )}
        {extra}
      </div>
    </section>
  );
}
