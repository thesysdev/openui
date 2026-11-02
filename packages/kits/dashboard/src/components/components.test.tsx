// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Dashboard } from "./Dashboard";
import { DashboardThemeProvider } from "./DashboardThemeProvider";
import { List } from "./List";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const themeSheets = () => [...document.head.querySelectorAll("style[data-openui-theme]")];

it("keeps the caller's dashboard theme when a dashboard mounts later", () => {
  const red = { textNeutralPrimary: "rgb(255, 0, 0)" };
  const page = (dashboards: number) => (
    <DashboardThemeProvider lightTheme={red}>
      {Array.from({ length: dashboards }, (_, i) => (
        <Dashboard key={i}>dashboard {i}</Dashboard>
      ))}
    </DashboardThemeProvider>
  );

  act(() => root.render(page(1)));
  act(() => root.render(page(2)));

  // One provider, so one sheet for the shared .openui-dashboard-theme selector,
  // and it is the caller's.
  expect(themeSheets()).toHaveLength(1);
  expect(themeSheets()[0]!.textContent).toContain("rgb(255, 0, 0)");
  expect(container.querySelectorAll(".openui-dashboard")).toHaveLength(2);
});

it("themes a dashboard rendered without a provider", () => {
  act(() => root.render(<Dashboard>alone</Dashboard>));

  expect(themeSheets()).toHaveLength(1);
  expect(container.querySelector(".openui-dashboard-theme .openui-dashboard")).not.toBeNull();
});

it("renders the list heading and description as separate styled parts", () => {
  act(() =>
    root.render(<List heading="Heading" description="Desc" items={[{ title: "First" }]} />),
  );

  const heading = container.querySelector(".openui-dashboard-list-heading");
  const description = container.querySelector(".openui-dashboard-list-description");
  expect(heading?.textContent).toBe("Heading");
  expect(description?.textContent).toBe("Desc");
  expect(heading?.parentElement).toBe(description?.parentElement);
  expect(heading?.parentElement?.classList).toContain("openui-dashboard-list-intro");
});
