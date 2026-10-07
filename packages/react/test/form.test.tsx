import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  ErrorSummary,
  FieldArray,
  Form,
  FormCheckbox,
  FormNumberField,
  FormSelect,
  FormSubmitButton,
  FormSwitch,
  FormTextField,
  SelectItem,
  StateBoundary,
  toActionState,
  toDataState,
  useFormState,
  useFormValues,
} from "../src";
import { axeViolations } from "./axe";

const user = () => userEvent.setup();

function SignIn({ onSubmit = () => {}, ...rest }: { onSubmit?: (v: any) => any } & Record<string, unknown>) {
  return (
    <Form defaultValues={{ email: "", password: "" }} onSubmit={onSubmit} {...rest}>
      <ErrorSummary />
      <FormTextField name="email" label="Email" type="email" isRequired validate={(v) => (v && !v.includes("@") ? "Enter a valid email." : null)} />
      <FormTextField name="password" label="Password" type="password" isRequired />
      <FormSubmitButton>Sign in</FormSubmitButton>
    </Form>
  );
}

describe("Form", () => {
  it("turns the browser checks off and submits the typed values", async () => {
    const onSubmit = vi.fn();
    const { container } = render(<SignIn onSubmit={onSubmit} />);
    expect(container.querySelector("form")).toHaveAttribute("novalidate");
    const u = user();
    await u.type(screen.getByLabelText(/Email/), "ada@example.com");
    await u.type(screen.getByLabelText(/Password/), "secret");
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: "ada@example.com", password: "secret" }));
  });

  it("submits with Enter from a text field", async () => {
    const onSubmit = vi.fn();
    render(<SignIn onSubmit={onSubmit} />);
    const u = user();
    await u.type(screen.getByLabelText(/Email/), "a@b.co");
    await u.type(screen.getByLabelText(/Password/), "x{Enter}");
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("shows no error before the first submit, then errors with aria wiring", async () => {
    const onSubmit = vi.fn();
    render(<SignIn onSubmit={onSubmit} />);
    const email = screen.getByLabelText(/Email/);
    expect(email).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Email is required")).toBeNull();
    const u = user();
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    expect(onSubmit).not.toHaveBeenCalled();
    const describedBy = email.getAttribute("aria-describedby")!;
    const text = describedBy.split(" ").map((id) => document.getElementById(id)?.textContent).join(" ");
    expect(text).toContain("Email is required");
  });

  it("moves focus to the ErrorSummary, which names each problem and links to its field", async () => {
    render(<SignIn />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    const summary = await screen.findByRole("region", { name: "There is a problem" });
    await waitFor(() => expect(summary).toHaveFocus());
    const links = within(summary).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Email is required", "Password is required"]);
    await u.click(links[1]);
    expect(screen.getByLabelText(/Password/)).toHaveFocus();
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(summary).toHaveFocus());
    await u.keyboard("{Tab}{Enter}");
    expect(screen.getByLabelText(/Email/)).toHaveFocus();
  });

  it("clears errors live after a failed submit, and the summary goes away when all is fixed", async () => {
    render(<SignIn />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("region", { name: "There is a problem" });
    await u.type(screen.getByLabelText(/Email/), "nope");
    await waitFor(() => expect(screen.getAllByText("Enter a valid email.").length).toBeGreaterThan(0));
    await u.type(screen.getByLabelText(/Email/), "@x.co");
    await u.type(screen.getByLabelText(/Password/), "pw");
    await waitFor(() => expect(screen.queryByRole("region", { name: "There is a problem" })).toBeNull());
    expect(screen.getByLabelText(/Email/)).not.toHaveAttribute("aria-invalid", "true");
  });

  it("validates on blur when asked to", async () => {
    render(<SignIn validateOn="blur" />);
    const u = user();
    await u.click(screen.getByLabelText(/Email/));
    await u.type(screen.getByLabelText(/Email/), "nope");
    expect(screen.getByLabelText(/Email/)).not.toHaveAttribute("aria-invalid", "true");
    await u.tab();
    await waitFor(() => expect(screen.getByLabelText(/Email/)).toHaveAttribute("aria-invalid", "true"));
  });

  it("accepts a Standard Schema (Zod) and puts its issues on the fields", async () => {
    const schema = z.object({ email: z.string().email("Use a real email."), age: z.number().min(18, "Must be 18 or older.") });
    const onSubmit = vi.fn();
    render(
      <Form defaultValues={{ email: "", age: 10 as number | null }} schema={schema as any} onSubmit={onSubmit}>
        <ErrorSummary />
        <FormTextField name="email" label="Email" />
        <FormNumberField name="age" label="Age" />
        <FormSubmitButton>Save</FormSubmitButton>
      </Form>,
    );
    const u = user();
    await u.click(screen.getByRole("button", { name: "Save" }));
    const summary = await screen.findByRole("region");
    expect(within(summary).getAllByRole("link").map((l) => l.textContent)).toEqual(["Email: Use a real email.", "Age: Must be 18 or older."]);
    await u.type(screen.getByLabelText("Email"), "a@b.co");
    const age = screen.getByRole("textbox", { name: "Age" });
    await u.clear(age);
    await u.type(age, "30");
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.co", age: 30 }));
  });

  it("supports async field validators", async () => {
    const taken = vi.fn(async (v: string) => (v === "taken" ? "That name is taken." : null));
    render(
      <Form defaultValues={{ name: "" }} onSubmit={() => {}}>
        <FormTextField name="name" label="Name" validateAsync={taken} />
        <FormSubmitButton>Go</FormSubmitButton>
      </Form>,
    );
    const u = user();
    await u.type(screen.getByLabelText("Name"), "taken");
    await u.click(screen.getByRole("button", { name: "Go" }));
    expect(await screen.findByText("That name is taken.")).toBeInTheDocument();
  });

  describe("action state", () => {
    function Async({ run }: { run: (v: any) => Promise<any> }) {
      return (
        <Form defaultValues={{ name: "Ada" }} onSubmit={run} successMessage="Saved." errorMessage="Could not save.">
          {({ state }) => (
            <>
              <ErrorSummary />
              <FormTextField name="name" label="Name" />
              <output data-testid="state">{state}</output>
              <FormSubmitButton>Save</FormSubmitButton>
            </>
          )}
        </Form>
      );
    }

    it("goes idle, pending, success and announces the success politely", async () => {
      let finish!: () => void;
      const run = vi.fn(() => new Promise<void>((r) => (finish = r)));
      render(<Async run={run} />);
      const u = user();
      expect(screen.getByTestId("state")).toHaveTextContent("idle");
      await u.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("pending"));
      expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-disabled", "true");
      // A second submit while pending is ignored.
      await u.keyboard("{Enter}");
      await u.click(screen.getByLabelText("Name"));
      await u.keyboard("{Enter}");
      expect(run).toHaveBeenCalledTimes(1);
      await act(async () => finish());
      await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("success"));
      expect(screen.getByText("Saved.").closest("[aria-live]")).toHaveAttribute("role", "status");
    });

    it("goes to error when onSubmit throws, and the summary shows the message and takes focus", async () => {
      render(<Async run={async () => Promise.reject(new Error("boom"))} />);
      await user().click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
      const summary = await screen.findByRole("region");
      expect(summary).toHaveTextContent("Could not save.");
      expect(summary).toHaveTextContent("There is a problem");
      await waitFor(() => expect(summary).toHaveFocus());
      // The summary speaks for it: the status region does not repeat it.
      expect(screen.getAllByRole("status").every((s) => !s.textContent?.includes("Could not save"))).toBe(true);
    });

    it("announces a failure itself when there is no ErrorSummary", async () => {
      render(
        <Form defaultValues={{}} onSubmit={async () => Promise.reject(new Error("x"))} errorMessage="Nope.">
          <FormSubmitButton>Go</FormSubmitButton>
        </Form>,
      );
      await user().click(screen.getByRole("button", { name: "Go" }));
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Nope."));
    });

    it("shows field errors returned by the server on those fields until the value changes", async () => {
      render(<Async run={async () => ({ fieldErrors: { name: "Already taken." } })} />);
      const u = user();
      await u.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true"));
      expect(screen.getAllByText("Already taken.").length).toBeGreaterThan(0);
      await u.type(screen.getByLabelText("Name"), "x");
      await waitFor(() => expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-invalid", "true"));
    });

    it("can put the default values back after success", async () => {
      render(
        <Form defaultValues={{ name: "" }} onSubmit={async () => {}} resetOnSuccess>
          <FormTextField name="name" label="Name" />
          <FormSubmitButton>Save</FormSubmitButton>
        </Form>,
      );
      const u = user();
      await u.type(screen.getByLabelText("Name"), "Ada");
      await u.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue(""));
    });

    it("exposes the state to children through useFormState", async () => {
      function Probe() {
        return <output data-testid="probe">{useFormState().state}</output>;
      }
      render(
        <Form defaultValues={{}} onSubmit={async () => {}}>
          <Probe />
          <FormSubmitButton>Go</FormSubmitButton>
        </Form>,
      );
      await user().click(screen.getByRole("button", { name: "Go" }));
      await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent("success"));
    });
  });

  it("wires Select, Checkbox, Switch and NumberField", async () => {
    const onSubmit = vi.fn();
    render(
      <Form defaultValues={{ role: null, terms: false, news: false, seats: null }} onSubmit={onSubmit}>
        <ErrorSummary />
        <FormSelect name="role" label="Role" isRequired>
          <SelectItem id="admin">Admin</SelectItem>
          <SelectItem id="viewer">Viewer</SelectItem>
        </FormSelect>
        <FormCheckbox name="terms" isRequired requiredMessage="Accept the terms.">
          I accept the terms
        </FormCheckbox>
        <FormSwitch name="news">Send news</FormSwitch>
        <FormNumberField name="seats" label="Seats" />
        <FormSubmitButton>Save</FormSubmitButton>
      </Form>,
    );
    const u = user();
    await u.click(screen.getByRole("button", { name: "Save" }));
    const summary = await screen.findByRole("region");
    expect(within(summary).getAllByRole("link").map((l) => l.textContent)).toEqual(["Role is required", "I accept the terms: Accept the terms."]);
    expect(screen.getByRole("checkbox", { name: "I accept the terms" })).toHaveAttribute("aria-invalid", "true");
    await u.click(screen.getByRole("checkbox", { name: "I accept the terms" }));
    await u.click(screen.getByRole("switch", { name: "Send news" }));
    await u.click(screen.getByRole("button", { name: /Role/ }));
    await u.click(await screen.findByRole("option", { name: "Viewer" }));
    await u.type(screen.getByRole("textbox", { name: "Seats" }), "4");
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ role: "viewer", terms: true, news: true, seats: 4 }));
  });

  it("checks a conditional field only while it is shown", async () => {
    function Address() {
      return useFormValues<{ post: boolean }, boolean>((v) => v.post) ? <FormTextField name="address" label="Address" isRequired /> : null;
    }
    const onSubmit = vi.fn();
    render(
      <Form defaultValues={{ post: false, address: "" }} onSubmit={onSubmit}>
        <FormSwitch name="post">By post</FormSwitch>
        <Address />
        <FormSubmitButton>Save</FormSubmitButton>
      </Form>,
    );
    const u = user();
    await u.click(screen.getByRole("switch", { name: "By post" }));
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByLabelText(/Address/)).toHaveAttribute("aria-invalid", "true"));
    await u.click(screen.getByRole("switch", { name: "By post" }));
    expect(screen.queryByLabelText(/Address/)).toBeNull();
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("lets the app derive values with useFormValues", async () => {
    function Greeting() {
      const name = useFormValues<{ name: string }, string>((v) => v.name);
      return <p data-testid="hello">Hello {name || "there"}</p>;
    }
    render(
      <Form defaultValues={{ name: "" }} onSubmit={() => {}}>
        <Greeting />
        <FormTextField name="name" label="Name" />
      </Form>,
    );
    expect(screen.getByTestId("hello")).toHaveTextContent("Hello there");
    await user().type(screen.getByLabelText("Name"), "Ada");
    expect(screen.getByTestId("hello")).toHaveTextContent("Hello Ada");
  });

  it("throws a clear error for a field outside a Form", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<FormTextField name="x" label="X" />)).toThrow(/inside a <Form>/);
    spy.mockRestore();
  });

  it("renders on the server", () => {
    const html = renderToString(
      <Form defaultValues={{ name: "Ada", lines: [{ q: 1 }] }} onSubmit={() => {}}>
        <ErrorSummary />
        <FormTextField name="name" label="Name" />
        <FieldArray name="lines" label="Lines" defaultRow={{ q: 1 }}>
          {(row) => <FormNumberField name={row.name("q")} label="Qty" />}
        </FieldArray>
        <FormSubmitButton>Save</FormSubmitButton>
      </Form>,
    );
    expect(html).toContain("noValidate");
    expect(html).toContain('value="Ada"');
    expect(html).toContain("Lines");
  });

  it("has no axe violations, with and without errors", async () => {
    const { container } = render(<SignIn />);
    expect(await axeViolations(container)).toEqual([]);
    await user().click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("region");
    expect(await axeViolations(container)).toEqual([]);
  });
});

type Line = { description: string; qty: number | null };

function Invoice({ rows = 2, ...rest }: { rows?: number } & Partial<React.ComponentProps<typeof FieldArray>>) {
  const initial = Array.from({ length: rows }, (_, i) => ({ description: `Item ${i + 1}`, qty: i + 1 }));
  const onSubmit = vi.fn();
  (globalThis as any).__submit = onSubmit;
  return (
    <Form defaultValues={{ lines: initial as Line[] }} onSubmit={onSubmit}>
      <FieldArray name="lines" label="Lines" itemLabel="Line" addLabel="Add line" emptyText="No lines yet." defaultRow={{ description: "", qty: 1 }} {...rest}>
        {(row) => (
          <>
            <FormTextField name={row.name("description")} label="Description" />
            <FormNumberField name={row.name("qty")} label="Qty" />
          </>
        )}
      </FieldArray>
      <TotalQty />
      <FormSubmitButton>Save</FormSubmitButton>
    </Form>
  );
}

function TotalQty() {
  const total = useFormValues<{ lines: Line[] }, number>((v) => v.lines.reduce((s, l) => s + (l.qty ?? 0), 0));
  return <p data-testid="total">Total {total}</p>;
}

const descriptions = () => screen.getAllByLabelText("Description").map((el) => (el as HTMLInputElement).value);
const status = () => screen.getAllByRole("status").map((s) => s.textContent?.replace(/ /g, "")).join("");

describe("FieldArray", () => {
  it("renders each row as a labelled group with named buttons", () => {
    render(<Invoice />);
    expect(screen.getByRole("group", { name: "Lines" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Line 1" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Line 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove line 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move line 1 down" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move line 1 up" })).toHaveAttribute("disabled");
    expect(screen.getByRole("button", { name: "Move line 2 down" })).toHaveAttribute("disabled");
  });

  it("adds a row, focuses its first field and announces it", async () => {
    render(<Invoice />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "Add line" }));
    await waitFor(() => expect(screen.getAllByLabelText("Description")).toHaveLength(3));
    expect(screen.getAllByLabelText("Description")[2]).toHaveFocus();
    expect(status()).toContain("Line 3 added");
  });

  it("removes a row and moves focus to the remove button of the row that took its place", async () => {
    render(<Invoice rows={3} />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "Remove line 2" }));
    await waitFor(() => expect(descriptions()).toEqual(["Item 1", "Item 3"]));
    expect(screen.getByRole("button", { name: "Remove line 2" })).toHaveFocus();
    expect(status()).toContain("Line 2 removed");
    // The last row: focus goes to the row before it.
    await u.click(screen.getByRole("button", { name: "Remove line 2" }));
    await waitFor(() => expect(descriptions()).toEqual(["Item 1"]));
    expect(screen.getByRole("button", { name: "Remove line 1" })).toHaveFocus();
  });

  it("focuses the Add button when the last row is removed, and shows the empty text", async () => {
    render(<Invoice rows={1} />);
    await user().click(screen.getByRole("button", { name: "Remove line 1" }));
    await waitFor(() => expect(screen.getByText("No lines yet.")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Add line" })).toHaveFocus();
    expect(status()).toContain("Line 1 removed");
  });

  it("moves rows with the keyboard, keeps focus on the button, and announces the new place", async () => {
    render(<Invoice rows={3} />);
    const u = user();
    screen.getByRole("button", { name: "Move line 1 down" }).focus();
    await u.keyboard("{Enter}");
    await waitFor(() => expect(descriptions()).toEqual(["Item 2", "Item 1", "Item 3"]));
    expect(screen.getByRole("button", { name: "Move line 2 down" })).toHaveFocus();
    expect(status()).toContain("Line moved to position 2 of 3");
    await u.keyboard("{Enter}");
    await waitFor(() => expect(descriptions()).toEqual(["Item 2", "Item 3", "Item 1"]));
    // At the end the pressed button is disabled, so focus goes to the other one.
    expect(screen.getByRole("button", { name: "Move line 3 up" })).toHaveFocus();
    await u.keyboard("{Enter}");
    await waitFor(() => expect(descriptions()).toEqual(["Item 2", "Item 1", "Item 3"]));
    expect(screen.getByRole("button", { name: "Move line 2 up" })).toHaveFocus();
  });

  it("keeps what was typed with its row when rows move", async () => {
    render(<Invoice rows={2} />);
    const u = user();
    await u.clear(screen.getAllByLabelText("Description")[0]);
    await u.type(screen.getAllByLabelText("Description")[0], "Edited");
    await u.click(screen.getByRole("button", { name: "Move line 1 down" }));
    await waitFor(() => expect(descriptions()).toEqual(["Item 2", "Edited"]));
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect((globalThis as any).__submit).toHaveBeenCalledWith({
        lines: [
          { description: "Item 2", qty: 2 },
          { description: "Edited", qty: 1 },
        ],
      }),
    );
  });

  it("inserts a row below and focuses it", async () => {
    render(<Invoice allowInsert />);
    await user().click(screen.getByRole("button", { name: "Insert line below line 1" }));
    await waitFor(() => expect(descriptions()).toEqual(["Item 1", "", "Item 2"]));
    expect(screen.getAllByLabelText("Description")[1]).toHaveFocus();
    expect(status()).toContain("Line 2 added");
  });

  it("respects minRows and maxRows, and says why Add is off", async () => {
    render(<Invoice rows={1} minRows={1} maxRows={2} />);
    const u = user();
    expect(screen.getByRole("button", { name: "Remove line 1" })).toHaveAttribute("disabled");
    await u.click(screen.getByRole("button", { name: "Add line" }));
    await waitFor(() => expect(descriptions()).toHaveLength(2));
    expect(screen.getByRole("button", { name: "Add line" })).toHaveAttribute("disabled");
    expect(screen.getByText("You can add up to 2.")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Lines" }).getAttribute("aria-describedby")).toBeTruthy();
    await u.click(screen.getByRole("button", { name: "Remove line 2" }));
    await waitFor(() => expect(descriptions()).toHaveLength(1));
    // At the minimum the remove button is disabled, so focus lands on the row's first field.
    expect(screen.getAllByLabelText("Description")[0]).toHaveFocus();
  });

  it("repeats the announcement when the same thing happens twice in a row", async () => {
    render(<Invoice rows={3} />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "Remove line 1" }));
    await waitFor(() => expect(status()).toContain("Line 1 removed"));
    const first = screen.getAllByRole("status").map((s) => s.textContent).join("|");
    await u.click(screen.getByRole("button", { name: "Remove line 1" }));
    await waitFor(() => expect(screen.getAllByRole("status").map((s) => s.textContent).join("|")).not.toBe(first));
    expect(status()).toContain("Line 1 removed");
  });

  it("can hide reordering and uses custom messages", async () => {
    render(<Invoice allowReorder={false} messages={{ remove: (_i, n) => `Delete ${n}`, announceRemoved: (_i, n) => `Gone ${n}` }} />);
    expect(screen.queryByRole("button", { name: /Move/ })).toBeNull();
    await user().click(screen.getByRole("button", { name: "Delete 1" }));
    await waitFor(() => expect(status()).toContain("Gone 1"));
  });

  it("checks the rows as a whole and shows it under the group", async () => {
    render(<Invoice rows={0} validate={(rows) => (rows.length === 0 ? "Add at least one line." : null)} />);
    await user().click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Add at least one line.")).toBeInTheDocument();
  });

  it("recalculates the app's own total as rows change", async () => {
    render(<Invoice rows={3} />);
    expect(screen.getByTestId("total")).toHaveTextContent("Total 6");
    await user().click(screen.getByRole("button", { name: "Remove line 3" }));
    await waitFor(() => expect(screen.getByTestId("total")).toHaveTextContent("Total 3"));
  });

  it("reports row errors in the summary and focuses the right row field", async () => {
    render(
      <Form defaultValues={{ lines: [{ d: "" }, { d: "" }] }} onSubmit={() => {}}>
        <ErrorSummary />
        <FieldArray name="lines" label="Lines" defaultRow={{ d: "" }}>
          {(row) => <FormTextField name={row.name("d")} label="Description" isRequired />}
        </FieldArray>
        <FormSubmitButton>Save</FormSubmitButton>
      </Form>,
    );
    const u = user();
    await u.click(screen.getByRole("button", { name: "Save" }));
    const summary = await screen.findByRole("region");
    const links = within(summary).getAllByRole("link");
    expect(links).toHaveLength(2);
    await u.click(links[1]);
    expect(screen.getAllByLabelText(/Description/)[1]).toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Invoice allowInsert maxRows={2} />);
    expect(await axeViolations(container)).toEqual([]);
    const empty = render(<Invoice rows={0} />);
    expect(await axeViolations(empty.container)).toEqual([]);
  });
});

describe("state", () => {
  it("maps the flags apps already have", () => {
    expect(toDataState({ isLoading: true })).toBe("loading");
    expect(toDataState({ isLoading: true, error: new Error("x") })).toBe("error");
    expect(toDataState({ isEmpty: true })).toBe("empty");
    expect(toDataState({})).toBe("ready");
    expect(toActionState({ isPending: true })).toBe("pending");
    expect(toActionState({ error: "x" })).toBe("error");
    expect(toActionState({ isSuccess: true })).toBe("success");
    expect(toActionState({})).toBe("idle");
  });

  it("renders the slot for the state, and marks loading as busy", () => {
    const slots = { loading: <p>Loading</p>, empty: <p>Empty</p>, error: <p>Failed</p> };
    const { rerender, container } = render(<StateBoundary state="loading" {...slots}>Data</StateBoundary>);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    rerender(<StateBoundary state="empty" {...slots}>Data</StateBoundary>);
    expect(screen.getByText("Empty")).toBeInTheDocument();
    rerender(<StateBoundary state="error" {...slots}>Data</StateBoundary>);
    expect(screen.getByText("Failed")).toBeInTheDocument();
    rerender(<StateBoundary state="ready" {...slots}>Data</StateBoundary>);
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.queryByText("Failed")).toBeNull();
  });
});
