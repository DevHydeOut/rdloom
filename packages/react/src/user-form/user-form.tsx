"use client";

import { createContext, createElement, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { FileTrigger } from "react-aria-components";
import { userFormDefaults, type UserFormSpecProps } from "../generated/user-form.types";
import { ActionButton } from "../action-button/action-button";
import { AlertDialog } from "../alert-dialog/alert-dialog";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { ErrorSummary } from "../error-summary/error-summary";
import { Field } from "../form/field";
import { Form, FormSubmitButton, useFormContext, useFormState, useFormValues, type SubmitResult } from "../form/form";
import { Select, SelectItem } from "../select/select";
import { Switch } from "../switch/switch";
import { TextField } from "../text-field/text-field";
import { cx } from "../utils/cx";
import { CheckIcon } from "../utils/icons";
import { resolvePermission, type PermissionValue, type ResolvedPermission } from "../utils/permissions";

export interface UserFormProps extends UserFormSpecProps {
  className?: string;
}

type Variant = NonNullable<UserFormProps["variant"]>;
type FieldKey = "avatar" | "jobTitle" | "phone" | "address" | "preferences" | "bio" | "team" | "role" | "status";
type UserValues = NonNullable<Parameters<UserFormProps["onSubmit"]>[0]>;
// Inside the form the team is always a string, so a Select can show "No team".
type Values = Omit<UserValues, "team" | "avatarFile"> & { team: string };
type Choice = { id: string; label: string; description?: string };
type Classes = UserFormProps["classNames"];

const NO_TEAM = "none";
const BIO_MAX = 280;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneChars = /^[\d\s().-]+$/;
const postalShape = /^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/;

const allFields: Record<FieldKey, boolean> = {
  avatar: true,
  jobTitle: true,
  phone: true,
  address: true,
  preferences: true,
  bio: true,
  team: true,
  role: true,
  status: true,
};
const fieldDefaults: Record<Variant, Record<FieldKey, boolean>> = {
  page: allFields,
  sheet: allFields,
  modal: { avatar: false, jobTitle: false, phone: false, address: false, preferences: false, bio: false, team: false, role: true, status: true },
};

const callingCodes: Choice[] = [
  { id: "US", label: "+1 (US)" },
  { id: "CA", label: "+1 (CA)" },
  { id: "GB", label: "+44 (UK)" },
  { id: "DE", label: "+49 (DE)" },
  { id: "FR", label: "+33 (FR)" },
  { id: "ES", label: "+34 (ES)" },
  { id: "IT", label: "+39 (IT)" },
  { id: "NL", label: "+31 (NL)" },
  { id: "IN", label: "+91 (IN)" },
  { id: "AU", label: "+61 (AU)" },
  { id: "JP", label: "+81 (JP)" },
  { id: "BR", label: "+55 (BR)" },
  { id: "MX", label: "+52 (MX)" },
  { id: "NG", label: "+234 (NG)" },
  { id: "ZA", label: "+27 (ZA)" },
];
const defaultCountries: Choice[] = [
  { id: "US", label: "United States" },
  { id: "CA", label: "Canada" },
  { id: "GB", label: "United Kingdom" },
  { id: "DE", label: "Germany" },
  { id: "FR", label: "France" },
  { id: "ES", label: "Spain" },
  { id: "IT", label: "Italy" },
  { id: "NL", label: "Netherlands" },
  { id: "IN", label: "India" },
  { id: "AU", label: "Australia" },
  { id: "JP", label: "Japan" },
  { id: "BR", label: "Brazil" },
  { id: "MX", label: "Mexico" },
  { id: "NG", label: "Nigeria" },
  { id: "ZA", label: "South Africa" },
];
const defaultTimeZones: Choice[] = [
  { id: "UTC", label: "UTC" },
  { id: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { id: "America/New_York", label: "Eastern Time (New York)" },
  { id: "America/Sao_Paulo", label: "Brasilia Time (Sao Paulo)" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Berlin", label: "Central European Time (Berlin)" },
  { id: "Africa/Lagos", label: "West Africa Time (Lagos)" },
  { id: "Asia/Kolkata", label: "India Standard Time (Kolkata)" },
  { id: "Asia/Tokyo", label: "Japan Standard Time (Tokyo)" },
  { id: "Australia/Sydney", label: "Sydney" },
];
const defaultLanguages: Choice[] = [
  { id: "en", label: "English" },
  { id: "de", label: "German" },
  { id: "fr", label: "French" },
  { id: "es", label: "Spanish" },
  { id: "pt", label: "Portuguese" },
  { id: "hi", label: "Hindi" },
  { id: "ja", label: "Japanese" },
];

interface UserFormContextValue {
  variant: Variant;
  readOnly: boolean;
  reason?: string;
}
const UserFormContext = createContext<UserFormContextValue>({ variant: "page", readOnly: false });

/**
 * Creates or edits a user, as a whole page, inside a Dialog or inside a Sheet. Save waits for a change, Cancel asks
 * before discarding one, and the danger zone holds Suspend and Delete user behind a confirmation. It saves nothing itself.
 * UI permission is not security: the server must check again.
 */
export function UserForm({
  mode = userFormDefaults.mode,
  variant = userFormDefaults.variant,
  fields,
  defaultValues,
  roles,
  teams,
  countries = defaultCountries,
  timeZones = defaultTimeZones,
  languages = defaultLanguages,
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
  const suspend = resolvePermission(permissions?.suspend ?? permissions?.edit);
  const show = { ...fieldDefaults[variant], ...fields };

  const initial: Values = {
    name: defaultValues?.name ?? "",
    email: defaultValues?.email ?? "",
    role: defaultValues?.role ?? "",
    status: defaultValues?.status ?? "active",
    team: defaultValues?.team ?? NO_TEAM,
    avatar: defaultValues?.avatar ?? null,
    jobTitle: defaultValues?.jobTitle ?? "",
    phoneCountry: defaultValues?.phoneCountry ?? "US",
    phone: defaultValues?.phone ?? "",
    street: defaultValues?.street ?? "",
    apartment: defaultValues?.apartment ?? "",
    city: defaultValues?.city ?? "",
    region: defaultValues?.region ?? "",
    postalCode: defaultValues?.postalCode ?? "",
    country: defaultValues?.country ?? "",
    timeZone: defaultValues?.timeZone ?? "",
    language: defaultValues?.language ?? "",
    bio: defaultValues?.bio ?? "",
  };
  const [initialValues] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [discardOpen, setDiscardOpen] = useState(false);
  const dirtyRef = useRef(false);
  const fileRef = useRef<File | null>(null);
  const headingId = useId();
  if (!edit.isVisible) return null;

  const isEdit = mode === "edit";
  const Heading = `h${Math.min(6, Math.max(1, Math.round(headingLevel)))}` as "h2";
  const sectionLevel = Math.min(6, Math.max(2, Math.round(headingLevel) + 1));
  const showRole = show.role && changeRole.isVisible;
  const showTeam = show.team && Boolean(teams && teams.length > 0);
  const hasDelete = Boolean(onDelete) && del.isVisible;
  const hasSuspend = Boolean(onSuspend) && suspend.isVisible;
  const hasDanger = isEdit && variant !== "modal" && (hasDelete || hasSuspend || Boolean(dangerZone));
  const sections = variant !== "modal";
  const readOnly = !edit.isAllowed;

  const submit = async (values: Values): Promise<void | SubmitResult> => {
    if (!edit.isAllowed) return { formError: edit.reason ?? "You cannot change this user." };
    const out: Record<string, unknown> = {
      name: values.name,
      email: values.email,
      role: values.role,
      status: values.status,
      team: values.team === NO_TEAM ? null : values.team,
    };
    if (show.avatar) {
      out.avatar = values.avatar;
      if (fileRef.current && values.avatar?.startsWith("blob:")) out.avatarFile = fileRef.current;
    }
    if (show.jobTitle) out.jobTitle = values.jobTitle;
    if (show.phone) Object.assign(out, { phoneCountry: values.phoneCountry, phone: values.phone });
    if (show.address) {
      Object.assign(out, { street: values.street, apartment: values.apartment, city: values.city, region: values.region, postalCode: values.postalCode, country: values.country });
    }
    if (show.preferences) Object.assign(out, { timeZone: values.timeZone, language: values.language });
    if (show.bio) out.bio = values.bio;
    const result = await onSubmit(out as UserValues);
    if (result && (result.formError || (result.fieldErrors && Object.keys(result.fieldErrors).length))) return result;
    setBaseline(JSON.stringify(values));
  };

  const askToCancel = () => {
    if (dirtyRef.current) setDiscardOpen(true);
    else onCancel?.();
  };

  const section = (key: string, name: string, description: string, body: ReactNode) => (
    <Section key={key} name={name} description={description} level={sectionLevel} classNames={classNames}>
      {body}
    </Section>
  );

  const nameField = (
    <Field<string> name="name" label="Name" isRequired>
      {(f) => (
        <TextField
          {...f.inputProps}
          label="Name"
          autoComplete="off"
          isReadOnly={readOnly}
          description={readOnly ? edit.reason : undefined}
        />
      )}
    </Field>
  );
  const emailField = (
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
          isReadOnly={isEdit || readOnly}
          isRequired={isEdit ? undefined : f.inputProps.isRequired}
          description={isEdit ? "Email cannot be changed here." : readOnly ? edit.reason : undefined}
        />
      )}
    </Field>
  );
  const roleField = showRole && (
    <ChoiceField
      name="role"
      label="Role"
      items={roles}
      isRequired
      readOnly={readOnly || !changeRole.isAllowed}
      reason={readOnly ? edit.reason : changeRole.reason}
      showDescription
    />
  );
  const statusField = show.status && <StatusSwitch readOnly={readOnly} reason={edit.reason} />;
  const teamField = showTeam && (
    <ChoiceField name="team" label="Team" items={[{ id: NO_TEAM, label: "No team" }, ...(teams ?? [])]} readOnly={readOnly} reason={edit.reason} />
  );

  let body: ReactNode;
  if (!sections) {
    body = (
      <div className={cx("flex flex-col gap-4", classNames?.fields)}>
        {nameField}
        {emailField}
        {roleField}
        {statusField}
        {teamField}
      </div>
    );
  } else {
    const showPrefs = show.preferences;
    const showAccess = Boolean(roleField || statusField || teamField);
    body = (
      <div className={cx("flex flex-col", variant === "sheet" ? "gap-6" : "gap-8", classNames?.fields)}>
        {variant === "sheet" && show.avatar && <AvatarField variant="sheet" readOnly={readOnly} fileRef={fileRef} classNames={classNames} />}
        {section(
          "profile",
          "Profile",
          "How this person appears to others.",
          <>
            {variant === "page" && show.avatar && (
              <div className="col-span-full">
                <AvatarField variant="page" readOnly={readOnly} fileRef={fileRef} classNames={classNames} />
              </div>
            )}
            <Half>{nameField}</Half>
            {show.jobTitle && (
              <Half>
                <Field<string> name="jobTitle" label="Job title">
                  {(f) => <TextField {...f.inputProps} label="Job title" autoComplete="organization-title" isReadOnly={readOnly} />}
                </Field>
              </Half>
            )}
          </>,
        )}
        {section(
          "contact",
          "Contact",
          "Where we reach this person.",
          <>
            <Full>{emailField}</Full>
            {show.phone && (
              <Full>
                <PhoneField readOnly={readOnly} />
              </Full>
            )}
          </>,
        )}
        {show.address &&
          section(
            "address",
            "Address",
            "Used for invoices and shipping.",
            <>
              <Full>
                <TextInput name="street" label="Street address" autoComplete="street-address" readOnly={readOnly} />
              </Full>
              <Full>
                <TextInput name="apartment" label="Apartment, suite or unit" autoComplete="address-line2" readOnly={readOnly} />
              </Full>
              <Half>
                <TextInput name="city" label="City" autoComplete="address-level2" readOnly={readOnly} />
              </Half>
              <Half>
                <TextInput name="region" label="State or region" autoComplete="address-level1" readOnly={readOnly} />
              </Half>
              <Half>
                <TextInput
                  name="postalCode"
                  label="Postal code"
                  autoComplete="postal-code"
                  readOnly={readOnly}
                  validate={(value) => (value && !postalShape.test(value.trim()) ? "Enter a valid postal code." : null)}
                />
              </Half>
              <Half>
                <ChoiceField name="country" label="Country" items={countries} readOnly={readOnly} reason={edit.reason} autoComplete="country-name" />
              </Half>
            </>,
          )}
        {(showPrefs || show.bio) &&
          section(
            "preferences",
            "Preferences",
            "Time zone, language and a short introduction.",
            <>
              {showPrefs && (
                <>
                  <Half>
                    <ChoiceField name="timeZone" label="Time zone" items={timeZones} readOnly={readOnly} reason={edit.reason} />
                  </Half>
                  <Half>
                    <ChoiceField name="language" label="Language" items={languages} readOnly={readOnly} reason={edit.reason} autoComplete="language" />
                  </Half>
                </>
              )}
              {show.bio && (
                <Full>
                  <BioField readOnly={readOnly} />
                </Full>
              )}
            </>,
          )}
        {showAccess &&
          section(
            "access",
            "Access",
            "What this person can do and whether they can sign in.",
            <>
              {roleField && <Full>{roleField}</Full>}
              {statusField && <Full>{statusField}</Full>}
              {teamField && <Full>{teamField}</Full>}
            </>,
          )}
      </div>
    );
  }

  return (
    <UserFormContext.Provider value={{ variant, readOnly, reason: edit.reason }}>
      <div
        className={cx(
          "flex w-full flex-col gap-6",
          variant === "sheet" && "min-h-full",
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
          className={cx("gap-6", variant === "sheet" && "flex-1", classNames?.form)}
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
          {body}
          {hasDanger && (
            <DangerZone
              classNames={classNames}
              variant={variant}
              level={sectionLevel}
              onDelete={hasDelete ? onDelete : undefined}
              onSuspend={hasSuspend ? onSuspend : undefined}
              deletePermission={permissions?.delete}
              suspendPermission={permissions?.suspend ?? permissions?.edit}
              initiallySuspended={initial.status === "suspended"}
              setBaseline={setBaseline}
              extra={dangerZone}
            />
          )}
          <Actions
            edit={edit}
            variant={variant}
            label={submitLabel ?? (isEdit ? "Save changes" : "Create user")}
            baseline={baseline}
            successMessage={successMessage}
            classNames={classNames}
            onCancel={askToCancel}
          />
        </Form>
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
    </UserFormContext.Provider>
  );
}

/** A field that takes the whole row of its section. */
function Full({ children }: { children: ReactNode }) {
  return <div className="col-span-full min-w-0">{children}</div>;
}
/** A field that shares a row with the next one, from the sm breakpoint on a page and always in a sheet. */
function Half({ children }: { children: ReactNode }) {
  return <div className="col-span-full min-w-0 sm:col-span-1">{children}</div>;
}

interface SectionProps {
  name: string;
  description: string;
  level: number;
  classNames: Classes;
  children: ReactNode;
}

/** One titled group of fields. On a page the heading sits in a left column from lg; in a sheet it sits above. */
function Section({ name, description, level, classNames, children }: SectionProps) {
  const { variant } = useContext(UserFormContext);
  const id = useId();
  const page = variant === "page";
  return (
    <section
      aria-labelledby={id}
      className={cx(
        "flex flex-col gap-4 border-t border-[var(--rd-color-border-default)] pt-6 first:border-t-0 first:pt-0",
        page && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-x-10 lg:pt-8 lg:first:pt-0",
        classNames?.section,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {createElement(`h${level}`, { id, className: "text-sm font-semibold text-[var(--rd-color-text-default)]" }, name)}
        <p className="text-sm text-[var(--rd-color-text-muted)]">{description}</p>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-2">{children}</div>
    </section>
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

interface TextInputProps {
  name: string;
  label: string;
  autoComplete: string;
  readOnly: boolean;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  validate?: (value: string) => string | null;
}

function TextInput({ name, label, autoComplete, readOnly, type, inputMode, validate }: TextInputProps) {
  return (
    <Field<string> name={name} label={label} validate={validate}>
      {(f) => <TextField {...f.inputProps} label={label} type={type} inputMode={inputMode} autoComplete={autoComplete} isReadOnly={readOnly} />}
    </Field>
  );
}

/** The calling-code select and the number, one beside the other. */
function PhoneField({ readOnly }: { readOnly: boolean }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <ChoiceField name="phoneCountry" label="Calling code" items={callingCodes} readOnly={readOnly} autoComplete="tel-country-code" />
      <Field<string>
        name="phone"
        label="Phone number"
        validate={(value) => {
          const text = String(value ?? "").trim();
          if (!text) return null;
          if (!phoneChars.test(text)) return "Use digits, spaces, dashes and brackets only.";
          const digits = text.replace(/\D/g, "").length;
          return digits < 6 || digits > 14 ? "Enter a phone number with 6 to 14 digits." : null;
        }}
      >
        {(f) => <TextField {...f.inputProps} label="Phone number" type="tel" inputMode="tel" autoComplete="tel-national" isReadOnly={readOnly} />}
      </Field>
    </div>
  );
}

function BioField({ readOnly }: { readOnly: boolean }) {
  return (
    <Field<string>
      name="bio"
      label="Short bio"
      validate={(value) => (String(value ?? "").length > BIO_MAX ? `Keep the bio to ${BIO_MAX} characters or fewer.` : null)}
    >
      {(f) => (
        <TextField
          {...f.inputProps}
          label="Short bio"
          multiline
          isReadOnly={readOnly}
          description={`${String(f.value ?? "").length} of ${BIO_MAX} characters`}
        />
      )}
    </Field>
  );
}

interface AvatarFieldProps {
  variant: Variant;
  readOnly: boolean;
  fileRef: { current: File | null };
  classNames: Classes;
}

/** The picture with Upload and Remove. The file is checked here; keeping it is up to onSubmit. */
function AvatarField({ variant, readOnly, fileRef, classNames }: AvatarFieldProps) {
  const { engine } = useFormContext();
  const avatar = useFormValues<Values, string | null>((v) => v.avatar);
  const name = useFormValues<Values, string>((v) => v.name);
  const email = useFormValues<Values, string>((v) => v.email);
  const hintId = useId();
  const errorId = useId();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  const choose = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setError(`${file.name} is not a PNG, JPEG, WebP or GIF picture.`);
      setStatus("");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError(`${file.name} is larger than 2 MB. Choose a smaller picture.`);
      setStatus("");
      return;
    }
    setError("");
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    const url = typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : `blob:${file.name}`;
    blobRef.current = url;
    fileRef.current = file;
    engine.setValue("avatar", url);
    setStatus(`Picture selected: ${file.name}. Save to keep it.`);
  };

  const remove = () => {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = null;
    fileRef.current = null;
    setError("");
    engine.setValue("avatar", null);
    setStatus("Picture removed. Save to keep the change.");
  };

  const sheet = variant === "sheet";
  return (
    <div className={cx("flex min-w-0 flex-col gap-3", classNames?.avatar)}>
      <div className="flex min-w-0 items-center gap-4">
        <Avatar
          name={name.trim() || "New user"}
          src={avatar ?? undefined}
          size="lg"
          className="!size-20 !text-xl"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {sheet && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-semibold text-[var(--rd-color-text-default)]">{name.trim() || "New user"}</span>
              {email && <span className="truncate text-sm text-[var(--rd-color-text-muted)]">{email}</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <FileTrigger acceptedFileTypes={AVATAR_TYPES} onSelect={choose}>
              <Button type="button" variant="secondary" size="sm" isDisabled={readOnly} aria-describedby={cx(hintId, error ? errorId : "")}>
                {avatar ? "Change picture" : "Upload picture"}
              </Button>
            </FileTrigger>
            {avatar && (
              <Button type="button" variant="ghost" size="sm" isDisabled={readOnly} onPress={remove}>
                Remove picture
              </Button>
            )}
          </div>
        </div>
      </div>
      <p id={hintId} className="text-xs text-[var(--rd-color-text-muted)]">
        PNG, JPEG, WebP or GIF, up to 2 MB.
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--rd-color-feedback-danger)]">
          {error}
        </p>
      )}
      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}

interface ChoiceFieldProps {
  name: string;
  label: string;
  items: Choice[];
  isRequired?: boolean;
  readOnly: boolean;
  reason?: string;
  showDescription?: boolean;
  autoComplete?: string;
}

/** A Select, or when the person may not change it a read-only field that can still be reached and says why. */
function ChoiceField({ name, label, items, isRequired, readOnly, reason, showDescription, autoComplete }: ChoiceFieldProps) {
  return (
    <Field<string> name={name} label={label} isRequired={isRequired && !readOnly}>
      {(f) => {
        const chosen = items.find((item) => item.id === f.value);
        const description = readOnly ? reason : showDescription ? chosen?.description : undefined;
        if (readOnly) {
          return <TextField name={name} label={label} value={chosen?.label ?? ""} isReadOnly description={description} />;
        }
        return (
          <Select {...f.selectProps} label={label} description={description} autoComplete={autoComplete}>
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
  variant: Variant;
  label: string;
  baseline: string;
  successMessage: string;
  classNames: Classes;
  onCancel: () => void;
}

/** Cancel and Save. On a page and in a sheet the bar stays at the bottom of what scrolls. */
function Actions({ edit, variant, label, baseline, successMessage, classNames, onCancel }: ActionsProps) {
  const { state, isPending } = useFormState();
  const dirty = useFormValues<Values, boolean>((v) => JSON.stringify(v) !== baseline);
  const reasonId = useId();
  const showSaved = state === "success" && !dirty;
  return (
    <div
      className={cx(
        "flex flex-wrap items-center justify-end gap-x-4 gap-y-2",
        variant === "page" && "sticky bottom-0 z-10 -mx-1 border-t border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-1 py-3",
        variant === "sheet" &&
          "sticky bottom-[-1.5rem] z-10 -mx-6 -mb-6 mt-auto border-t border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] px-6 py-4",
        classNames?.actions,
      )}
    >
      {showSaved && (
        <p className={cx("me-auto flex items-center gap-2 text-sm text-[var(--rd-color-feedback-success)]", classNames?.status)}>
          <CheckIcon className="size-4 shrink-0" />
          {successMessage}
        </p>
      )}
      {edit.isDisabled && edit.reason && (
        <p id={reasonId} className="me-auto min-w-0 text-sm text-[var(--rd-color-text-muted)]">
          {edit.reason}
        </p>
      )}
      <div className="flex gap-2">
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
    </div>
  );
}

interface DangerZoneProps {
  classNames: Classes;
  variant: Variant;
  level: number;
  onDelete: UserFormProps["onDelete"];
  onSuspend: UserFormProps["onSuspend"];
  deletePermission?: PermissionValue;
  suspendPermission?: PermissionValue;
  initiallySuspended: boolean;
  setBaseline: (update: (baseline: string) => string) => void;
  extra?: ReactNode;
}

function DangerZone({ classNames, variant, level, onDelete, onSuspend, deletePermission, suspendPermission, initiallySuspended, setBaseline, extra }: DangerZoneProps) {
  const headingId = useId();
  const { engine } = useFormContext();
  const [suspended, setSuspended] = useState(initiallySuspended);
  const runSuspend = async () => {
    const next = !suspended;
    await onSuspend?.(next);
    setSuspended(next);
    // The status switch follows, and counts as saved: the action already happened.
    const status = next ? "suspended" : "active";
    engine.setValue("status", status);
    setBaseline((b) => JSON.stringify({ ...JSON.parse(b), status }));
  };
  return (
    <section
      role="group"
      aria-labelledby={headingId}
      className={cx(
        "flex flex-col gap-4 rounded-[var(--rd-radius-overlay)] border border-[color-mix(in_srgb,var(--rd-color-feedback-danger)_40%,var(--rd-color-border-default))] p-5",
        variant === "sheet" && "p-4",
        classNames?.dangerZone,
      )}
    >
      <div className="flex flex-col gap-1">
        {createElement(`h${level}`, { id: headingId, className: "text-sm font-semibold text-[var(--rd-color-feedback-danger)]" }, "Danger zone")}
        <p className="text-sm text-[var(--rd-color-text-muted)]">These actions affect this person&apos;s access to everything.</p>
      </div>
      <div className="flex flex-col gap-4">
        {onSuspend && (
          <DangerRow
            title={suspended ? "Reinstate access" : "Suspend access"}
            description={suspended ? "They can sign in again with their current role." : "They are signed out and cannot sign in until you reinstate them."}
          >
            <ActionButton
              variant="secondary"
              permission={suspendPermission}
              onAction={runSuspend}
              confirm={
                suspended
                  ? { title: "Reinstate this user?", description: "They can sign in again.", confirmLabel: "Reinstate" }
                  : { title: "Suspend this user?", description: "They are signed out and cannot sign in until you make them active again.", confirmLabel: "Suspend" }
              }
            >
              {suspended ? "Reinstate" : "Suspend"}
            </ActionButton>
          </DangerRow>
        )}
        {onDelete && (
          <DangerRow title="Delete user" description="Removes the user for good. This cannot be undone.">
            <ActionButton
              variant="danger"
              permission={deletePermission}
              onAction={onDelete}
              confirm={{ title: "Delete this user?", description: "This removes the user for good. It cannot be undone.", confirmLabel: "Delete user" }}
            >
              Delete user
            </ActionButton>
          </DangerRow>
        )}
        {extra && <div className="flex flex-wrap gap-2">{extra}</div>}
      </div>
    </section>
  );
}

function DangerRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[var(--rd-color-border-default)] pt-4 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
        <span className="text-sm font-medium text-[var(--rd-color-text-default)]">{title}</span>
        <span className="text-sm text-[var(--rd-color-text-muted)]">{description}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
