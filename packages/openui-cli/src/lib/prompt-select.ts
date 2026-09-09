import { styleText } from "node:util";

import { CliCancelledError } from "./telemetry";

export type PromptSelectOptions = {
  pageSize?: number;
  loop?: boolean;
  /** Keep the first N choices on screen while the rest scroll. */
  pinCount?: number;
};

type NormalizedChoice = {
  value: string;
  name: string;
  short: string;
  disabled: boolean | string;
  description?: string;
};

type SeparatorLike = { separator: string };
type SelectItem = NormalizedChoice | SeparatorLike;

function lastNavigableIndex(
  items: SelectItem[],
  isNavigable: (item: SelectItem) => boolean,
): number {
  for (let i = items.length - 1; i >= 0; i--) {
    if (isNavigable(items[i]!)) return i;
  }
  return -1;
}

function isChoice(item: SelectItem): item is NormalizedChoice {
  return "value" in item;
}

function renderChoice(
  item: SelectItem,
  isActive: boolean,
  isSeparator: (item: SelectItem) => boolean,
): string {
  if (isSeparator(item) || !isChoice(item)) return ` ${(item as SeparatorLike).separator}`;
  const cursor = isActive ? "❯" : " ";
  const color = isActive ? (text: string) => styleText("cyan", text) : (text: string) => text;
  return color(`${cursor} ${item.name}`);
}

type PinnedSelect = (config: {
  message: string;
  choices: readonly unknown[];
  pageSize: number;
  loop: boolean;
  pinCount: number;
}) => Promise<string>;

let pinnedSelect: PinnedSelect | undefined;

async function getPinnedSelect(): Promise<PinnedSelect> {
  if (pinnedSelect) return pinnedSelect;

  const {
    createPrompt,
    isDownKey,
    isEnterKey,
    isUpKey,
    makeTheme,
    Separator,
    useKeypress,
    useMemo,
    usePagination,
    usePrefix,
    useState,
  } = await import("@inquirer/core");

  const isSeparator = (item: SelectItem): item is SeparatorLike => Separator.isSeparator(item);
  const isNavigable = (item: SelectItem): boolean => !isSeparator(item) && !item.disabled;

  const normalizeChoices = (choices: readonly unknown[]): SelectItem[] =>
    choices.map((choice) => {
      if (Separator.isSeparator(choice)) return choice;
      if (typeof choice !== "object" || choice === null || !("value" in choice)) {
        const name = String(choice);
        return { value: name, name, short: name, disabled: false };
      }
      const raw = choice as {
        value: unknown;
        name?: unknown;
        short?: unknown;
        disabled?: unknown;
        description?: unknown;
      };
      const name = typeof raw.name === "string" ? raw.name : String(raw.value);
      return {
        value: String(raw.value),
        name,
        short: typeof raw.short === "string" ? raw.short : name,
        disabled: (raw.disabled as boolean | string | undefined) ?? false,
        description: typeof raw.description === "string" ? raw.description : undefined,
      };
    });

  pinnedSelect = createPrompt<
    string,
    {
      message: string;
      choices: readonly unknown[];
      pageSize: number;
      loop: boolean;
      pinCount: number;
    }
  >((config, done) => {
    const { pageSize, loop, pinCount } = config;
    const theme = makeTheme();
    const { keybindings } = theme;
    const [status, setStatus] = useState("idle");
    const prefix = usePrefix({ status, theme });
    const items = useMemo(() => normalizeChoices(config.choices), [config.choices]);
    const bounds = useMemo(
      () => ({
        first: items.findIndex(isNavigable),
        last: lastNavigableIndex(items, isNavigable),
      }),
      [items],
    );
    const [active, setActive] = useState(bounds.first === -1 ? 0 : bounds.first);
    const selected = items[active];

    useKeypress((key) => {
      if (selected == null || isSeparator(selected)) return;
      if (isEnterKey(key)) {
        if (!isNavigable(selected)) return;
        setStatus("done");
        done(selected.value);
        return;
      }
      if (!isUpKey(key, keybindings) && !isDownKey(key, keybindings)) return;
      const atStart = active === bounds.first;
      const atEnd = active === bounds.last;
      if (
        !loop &&
        ((isUpKey(key, keybindings) && atStart) || (isDownKey(key, keybindings) && atEnd))
      ) {
        return;
      }
      const offset = isUpKey(key, keybindings) ? -1 : 1;
      let next = active;
      do {
        next = (next + offset + items.length) % items.length;
      } while (!isNavigable(items[next]!));
      setActive(next);
    });

    const rest = items.slice(pinCount);
    const restActive = active < pinCount ? -1 : active - pinCount;
    const restPage = usePagination({
      items: rest,
      active: Math.max(0, restActive),
      renderItem({ item, index }) {
        return renderChoice(item, restActive === index, isSeparator);
      },
      pageSize,
      loop: false,
    });

    if (status === "done") {
      const answer = selected && !isSeparator(selected) ? selected.short : "";
      return [prefix, theme.style.message(config.message, status), theme.style.answer(answer)]
        .filter(Boolean)
        .join(" ");
    }

    const description =
      selected && !isSeparator(selected) && selected.description
        ? styleText("cyan", selected.description)
        : "";
    const pinnedLines = items
      .slice(0, pinCount)
      .map((item, index) => renderChoice(item, index === active, isSeparator))
      .join("\n");
    const helpLine = `${styleText("bold", "↑↓")} ${styleText("dim", "navigate")} ${styleText("dim", "•")} ${styleText("bold", "⏎")} ${styleText("dim", "select")}`;

    return [
      [prefix, theme.style.message(config.message, status)].filter(Boolean).join(" "),
      pinnedLines,
      restPage,
      " ",
      description,
      helpLine,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return pinnedSelect;
}

export async function promptSelect(
  message: string,
  choices: readonly unknown[],
  options?: number | PromptSelectOptions,
): Promise<string> {
  const resolved =
    typeof options === "number"
      ? { pageSize: options, loop: true, pinCount: 0 }
      : {
          pageSize: options?.pageSize ?? choices.length,
          loop: options?.loop ?? true,
          pinCount: options?.pinCount ?? 0,
        };

  try {
    if (resolved.pinCount > 0) {
      const selectPinned = await getPinnedSelect();
      return await selectPinned({
        message,
        choices,
        pageSize: resolved.pageSize,
        loop: resolved.loop,
        pinCount: resolved.pinCount,
      });
    }
    const { select } = await import("@inquirer/prompts");
    return await select<string>({
      message,
      choices: choices as never,
      pageSize: resolved.pageSize,
      loop: resolved.loop,
    });
  } catch (err) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (err instanceof ExitPromptError) {
      throw new CliCancelledError("args_resolution");
    }
    throw err;
  }
}
