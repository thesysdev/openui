// @vitest-environment jsdom

import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenUIPresent, OpenUIPrompt } from "../renderers";

const { appendToThread } = vi.hoisted(() => ({ appendToThread: vi.fn() }));

vi.mock("@assistant-ui/react", () => ({
  useAui: () => ({ thread: { append: appendToThread } }),
}));

const FORM = `root = Card([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
btns = Buttons([Button("Submit", Action([@ToAssistant("Submit")]), "primary")])`;

const MALFORMED = "root = MissingComponent([])";

const FOLLOW_UPS = `root = Card([followUps])
followUps = FollowUpBlock([first, second])
first = FollowUpItem("Tell me more")
second = FollowUpItem("Show another example")`;

const CLICKABLE_LIST = `root = Card([list])
list = ListBlock([item])
item = ListItem("Compare regions", "See the regional breakdown", null, "Explore", Action([@ToAssistant("Compare regions")]))`;

const OPEN_URL = `root = Card([buttons])
buttons = Buttons([Button("Open docs", Action([@OpenUrl("https://openui.com/docs")]), "primary")])`;

type PromptProps = ComponentProps<typeof OpenUIPrompt>;
type PresentProps = ComponentProps<typeof OpenUIPresent>;

const makeProps = (overrides: Partial<PromptProps> = {}): PromptProps =>
  ({
    type: "tool-call",
    toolCallId: "openui-call",
    toolName: "prompt_openui",
    args: { ui: FORM },
    argsText: JSON.stringify({ ui: FORM }),
    status: { type: "complete" },
    addResult: vi.fn(),
    resume: vi.fn(),
    respondToApproval: vi.fn(),
    ...overrides,
  }) as PromptProps;

const makePresentProps = (overrides: Partial<PresentProps> = {}): PresentProps =>
  ({
    type: "tool-call",
    toolCallId: "openui-present-call",
    toolName: "present_openui",
    args: { ui: FOLLOW_UPS },
    argsText: JSON.stringify({ ui: FOLLOW_UPS }),
    status: { type: "complete" },
    result: { displayed: true },
    addResult: vi.fn(),
    resume: vi.fn(),
    respondToApproval: vi.fn(),
    ...overrides,
  }) as PresentProps;

const setInputValue = (input: HTMLInputElement, value: string) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("OpenUIPresent", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    appendToThread.mockReset();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.restoreAllMocks();
    container.remove();
  });

  it("starts a new user turn when a follow-up is clicked", async () => {
    await act(async () => {
      root.render(<OpenUIPresent {...makePresentProps()} />);
    });

    const followUp = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Tell me more",
    );
    expect(followUp).toBeDefined();

    await act(async () => followUp!.click());

    expect(appendToThread).toHaveBeenCalledOnce();
    expect(appendToThread).toHaveBeenCalledWith({
      role: "user",
      content: [{ type: "text", text: "Tell me more" }],
    });
  });

  it("starts a new user turn when a clickable list item is selected", async () => {
    const args = { ui: CLICKABLE_LIST };

    await act(async () => {
      root.render(
        <OpenUIPresent
          {...makePresentProps({
            args,
            argsText: JSON.stringify(args),
          })}
        />,
      );
    });

    const item = Array.from(container.querySelectorAll<HTMLElement>('[role="button"]')).find(
      (element) => element.textContent?.includes("Compare regions"),
    );
    expect(item).toBeDefined();

    await act(async () => item!.click());

    expect(appendToThread).toHaveBeenCalledOnce();
    expect(appendToThread).toHaveBeenCalledWith({
      role: "user",
      content: [{ type: "text", text: "Compare regions" }],
    });
  });

  it("opens URL actions in a new isolated tab", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const args = { ui: OPEN_URL };

    await act(async () => {
      root.render(
        <OpenUIPresent
          {...makePresentProps({
            args,
            argsText: JSON.stringify(args),
          })}
        />,
      );
    });

    const button = Array.from(container.querySelectorAll("button")).find(
      (item) => item.textContent === "Open docs",
    );
    expect(button).toBeDefined();

    await act(async () => button!.click());

    expect(open).toHaveBeenCalledWith("https://openui.com/docs", "_blank", "noopener,noreferrer");
  });
});

describe("OpenUIPrompt", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  const renderPrompt = async (props: PromptProps) => {
    await act(async () => {
      root.render(<OpenUIPrompt {...props} />);
    });
  };

  it("provides OpenUI theme tokens by default", async () => {
    await renderPrompt(makeProps());

    expect(document.head.querySelector("style[data-openui-theme]")).not.toBeNull();
  });

  it("can defer theming to a host provider", async () => {
    await renderPrompt(makeProps({ disableThemeProvider: true }));

    expect(document.head.querySelector("style[data-openui-theme]")).toBeNull();
  });

  it("submits once and restores the completed form state", async () => {
    const addResult = vi.fn();
    await renderPrompt(makeProps({ addResult }));

    const name = container.querySelector<HTMLInputElement>('input[name="name"]');
    const email = container.querySelector<HTMLInputElement>('input[name="email"]');
    const submit = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Submit",
    );

    expect(name).not.toBeNull();
    expect(email).not.toBeNull();
    expect(submit).toBeDefined();

    await act(async () => {
      setInputValue(name!, "Ada Lovelace");
      setInputValue(email!, "ada@example.com");
    });
    await act(async () => {
      submit!.click();
      submit!.click();
    });

    expect(addResult).toHaveBeenCalledOnce();
    const result = addResult.mock.calls[0]![0];
    expect(result).toMatchObject({ message: "Submit", formName: "contact" });
    expect(result.formState).toBeDefined();

    await renderPrompt(makeProps({ result }));

    expect(container.querySelector<HTMLInputElement>('input[name="name"]')?.value).toBe(
      "Ada Lovelace",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="email"]')?.value).toBe(
      "ada@example.com",
    );
  });

  it("waits until streaming ends before showing parser errors", async () => {
    const malformedArgs = { ui: MALFORMED };
    await renderPrompt(
      makeProps({
        args: malformedArgs,
        argsText: JSON.stringify(malformedArgs),
        status: { type: "running" },
      }),
    );

    expect(container.querySelector('[role="alert"]')).toBeNull();

    await renderPrompt(
      makeProps({
        args: malformedArgs,
        argsText: JSON.stringify(malformedArgs),
      }),
    );

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "OpenUI could not render this response.",
    );

    await renderPrompt(makeProps());
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("does not show the fallback for a warning when the program renders", async () => {
    const args = { ui: 'card = Card([h])\nh = CardHeader("Entry", "B")' };
    await renderPrompt(makeProps({ args, argsText: JSON.stringify(args) }));

    expect(container.textContent).toContain("Entry");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
