import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppFooter, AuthCard, Button, DashboardPage, EmptyState, ErrorState, PageHeader, SectionHeader, StateBoundary } from "../src";
import { axeViolations } from "./axe";

describe("PageHeader", () => {
  it("renders an h1 with description, actions, breadcrumbs, tabs and meta", () => {
    render(
      <PageHeader title="Invoice 2041" description="Paid" meta={<span>Paid badge</span>} actions={<button>Send</button>} breadcrumbs={<nav aria-label="Trail">Home</nav>} tabs={<div role="tablist" aria-label="Sections" />} />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Invoice 2041" })).toBeInTheDocument();
    expect(screen.getByText("Paid badge")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Trail" })).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("changes the heading level and clamps it", () => {
    const { rerender } = render(<PageHeader title="Inner" headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    rerender(<PageHeader title="Inner" headingLevel={9} />);
    expect(screen.getByRole("heading", { level: 6 })).toBeInTheDocument();
  });

  it("shows skeletons and marks itself busy while loading", () => {
    const { container } = render(<PageHeader title="Hidden" description="Hidden too" isLoading />);
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Hidden")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Loading" })).toBeInTheDocument();
  });

  it("applies classNames to the matching parts, the size and the border", () => {
    const { container } = render(<PageHeader title="T" description="D" actions={<i>a</i>} size="compact" border classNames={{ root: "x-root", title: "x-title", description: "x-desc", actions: "x-actions" }} />);
    expect(container.firstElementChild).toHaveClass("x-root", "border-b");
    expect(screen.getByRole("heading")).toHaveClass("x-title", "text-lg");
    expect(screen.getByText("D")).toHaveClass("x-desc");
    expect(screen.getByText("a").parentElement).toHaveClass("x-actions");
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<PageHeader title="Server" />)).toContain("Server");
    const { container } = render(<PageHeader title="T" description="D" actions={<button>Go</button>} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("DashboardPage through PageHeader", () => {
  it("keeps one h1 and passes classNames to its parts", () => {
    const { container } = render(
      <DashboardPage title="Customers" description="d" actions={<button>Add</button>} stats={[{ label: "A", value: 1 }]} classNames={{ root: "p-root", header: "p-header", title: "p-title", stats: "p-stats", stat: "p-stat", content: "p-content" }}>
        <p>Body</p>
      </DashboardPage>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass("p-root");
    expect(container.querySelector(".p-header")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("p-title");
    expect(screen.getByRole("region", { name: "Key numbers" })).toHaveClass("p-stats");
    expect(screen.getByText("Body").parentElement).toHaveClass("p-content");
  });
});

describe("SectionHeader", () => {
  it("renders an h2 with description and actions, and the divider", () => {
    const { container } = render(<SectionHeader title="Recent invoices" description="Newest first" actions={<button>All</button>} divider classNames={{ root: "s-root" }} />);
    expect(screen.getByRole("heading", { level: 2, name: "Recent invoices" })).toBeInTheDocument();
    expect(screen.getByText("Newest first")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("border-b", "s-root");
  });

  it("keeps the level from 2 to 6", () => {
    render(<SectionHeader title="Deep" headingLevel={1} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<SectionHeader title="Server" />)).toContain("Server");
    const { container } = render(<SectionHeader title="T" actions={<button>Go</button>} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

const groups = [
  { title: "Product", links: [{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }] },
  { title: "Legal", links: [{ label: "Privacy", href: "/privacy", external: true }] },
];

describe("AppFooter", () => {
  it("is a contentinfo landmark with a named nav of links (simple)", () => {
    render(<AppFooter text="© 2026 rdloom" links={[{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }]} social={<a href="/feed">Feed</a>} />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Footer" });
    expect(within(nav).getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual(["/privacy", "/terms"]);
    expect(screen.getByText("© 2026 rdloom")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Feed" })).toBeInTheDocument();
  });

  it("lists groups under headings in the columns layout", () => {
    render(<AppFooter layout="columns" links={groups} navLabel="Site" />);
    const nav = screen.getByRole("navigation", { name: "Site" });
    expect(within(nav).getByRole("heading", { level: 2, name: "Product" })).toBeInTheDocument();
    expect(within(nav).getAllByRole("list")).toHaveLength(2);
  });

  it("flattens groups in the simple layout and tells screen readers about new tabs", () => {
    render(<AppFooter links={groups} />);
    expect(screen.queryByRole("heading")).toBeNull();
    const link = screen.getByRole("link", { name: /Privacy/ });
    expect(link).toHaveAccessibleName("Privacy (opens in a new tab)");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("draws links with renderLink", () => {
    render(<AppFooter links={[{ label: "Help", href: "/help" }]} renderLink={({ link, className, children }) => <a data-router href={link.href} className={className}>{children}</a>} />);
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("data-router");
  });

  it("applies classNames and has the same spacing every time", () => {
    const { container } = render(<AppFooter text="t" classNames={{ root: "f-root", text: "f-text" }} />);
    expect(container.firstElementChild).toHaveClass("f-root");
    expect(container.querySelector(".f-text")).not.toBeNull();
    expect(container.querySelector("footer > div")).toHaveClass("max-w-7xl", "px-4", "py-8");
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<AppFooter layout="columns" links={groups} />)).toContain("Product");
    for (const layout of ["simple", "columns"] as const) {
      const { container, unmount } = render(<AppFooter layout={layout} text="t" links={groups} />);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});

describe("ErrorState", () => {
  it("shows title, description and actions, and the actions work from the keyboard", async () => {
    const retry = vi.fn();
    render(<ErrorState title="Could not load" description="Try again." actions={<Button onPress={retry}>Retry</Button>} />);
    expect(screen.getByRole("heading", { level: 2, name: "Could not load" })).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Retry" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(retry).toHaveBeenCalled();
  });

  it("announces with role alert only when asked", () => {
    const { rerender } = render(<ErrorState title="Oops" />);
    expect(screen.queryByRole("alert")).toBeNull();
    rerender(<ErrorState title="Oops" announce />);
    expect(screen.getByRole("alert")).toHaveTextContent("Oops");
  });

  it("shows a code, a page variant and a heading level", () => {
    const { container } = render(<ErrorState variant="page" headingLevel={1} code="404" title="Not found" classNames={{ code: "e-code" }} />);
    expect(screen.getByRole("heading", { level: 1, name: "Not found" })).toBeInTheDocument();
    expect(screen.getByText("404")).toHaveClass("e-code");
    expect(container.firstElementChild).toHaveClass("min-h-[24rem]");
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<ErrorState title="Server" />)).toContain("Server");
    const { container } = render(<ErrorState title="T" description="D" actions={<Button>Go</Button>} announce />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("StateBoundary with ErrorState", () => {
  it("shows the slot for each state", () => {
    const slots = { loading: <p>Wait</p>, empty: <EmptyState title="None" />, error: <ErrorState title="Broken" /> };
    const { rerender } = render(<StateBoundary state="loading" {...slots}>Data</StateBoundary>);
    expect(screen.getByText("Wait")).toBeInTheDocument();
    rerender(<StateBoundary state="empty" {...slots}>Data</StateBoundary>);
    expect(screen.getByText("None")).toBeInTheDocument();
    rerender(<StateBoundary state="error" {...slots}>Data</StateBoundary>);
    expect(screen.getByText("Broken")).toBeInTheDocument();
    rerender(<StateBoundary state="ready" {...slots}>Data</StateBoundary>);
    expect(screen.getByText("Data")).toBeInTheDocument();
  });
});

describe("AuthCard", () => {
  it("renders title, description, brand, form, providers with a labelled separator and footer", () => {
    render(
      <AuthCard brand={<span>Brand</span>} title="Sign in" description="Welcome" socialProviders={<button>SSO</button>} footer={<a href="/x">Create an account</a>}>
        <form aria-label="Sign in form">
          <button>Go</button>
        </form>
      </AuthCard>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toHaveTextContent("or continue with");
    expect(screen.getByRole("button", { name: "SSO" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toBeInTheDocument();
  });

  it("keeps the order of the keyboard: form, providers, footer", async () => {
    render(
      <AuthCard title="T" socialProviders={<button>SSO</button>} footer={<a href="/x">Link</a>}>
        <input aria-label="Email" />
      </AuthCard>,
    );
    await userEvent.tab();
    expect(screen.getByLabelText("Email")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "SSO" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Link" })).toHaveFocus();
  });

  it("hides the illustration from screen readers and uses two columns", () => {
    const { container } = render(<AuthCard title="T" illustration={<p>Picture</p>} classNames={{ card: "a-card", illustration: "a-illus" }} />);
    const side = container.querySelector(".a-illus");
    expect(side).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".a-card")).toHaveClass("lg:grid-cols-2");
  });

  it("applies the size and classNames", () => {
    const { container } = render(<AuthCard title="T" size="lg" classNames={{ root: "a-root", title: "a-title" }} />);
    expect(container.firstElementChild).toHaveClass("a-root");
    expect(screen.getByRole("heading")).toHaveClass("a-title");
    expect(container.querySelector(".max-w-\\[32rem\\]")).not.toBeNull();
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<AuthCard title="Server" />)).toContain("Server");
    const { container } = render(
      <AuthCard title="Sign in" description="d" socialProviders={<button>SSO</button>} footer={<a href="/x">Link</a>}>
        <input aria-label="Email" />
      </AuthCard>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
