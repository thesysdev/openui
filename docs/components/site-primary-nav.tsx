"use client";

import {
  ArrowRight,
  ArrowUpRight,
  ArrowsOutLineHorizontal,
  Asterisk,
  Book,
  Bug,
  ChartPieSlice,
  ChatCenteredText,
  Code,
  CreditCard,
  DeviceMobileCamera,
  MagnifyingGlass,
  Monitor,
  PlugsConnected,
  PresentationChart,
  Users,
  type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./site-primary-nav.module.css";

type NavLeaf = {
  title: string;
  href: string;
  newTab?: boolean;
  badge?: string;
};

type NavDropdownChild = {
  title: string;
  href: string;
  description?: string;
  newTab?: boolean;
  /* Preview art shown above the label in the desktop mega-menu, exported at 2x
     from the menu design's own frames. Decorative — the adjacent title already
     names the destination. */
  preview?: { light: string; dark: string };
  /* Leading glyph for a "list" row, in its own square tile. Literal about
     the destination: a bug for Debug, a chart for Benchmarks. Unused by
     "cards", which show art instead. */
  icon?: Icon;
  /* Announced but not yet reachable. Renders as plain text with a tag instead of
     a link, so there is nothing to click and nothing to tab to. The href stays
     put: clearing this flag is all it takes to turn it back on. */
  comingSoon?: true;
  /* A short status chip under the card's copy, on an item that is otherwise a
     normal link. Unlike `comingSoon` this changes no behaviour: the arrow, the
     hover and the destination all stay. Rendered uppercase by the stylesheet,
     so write it in sentence case. */
  tag?: string;
};

/* A labelled run of cards inside one menu, for a menu whose cards divide along a
   line worth naming. Product splits by how you run it: the open source project
   against the things we host. A menu whose cards are simply a list of peers
   passes `children` and gets no labels at all. */
type NavGroup = {
  label: string;
  children: NavDropdownChild[];
  /* Share the previous group's column rather than opening a new one. For two
     short groups that would each waste a column of their own. */
  stacked?: true;
};

type NavDropdown = {
  title: string;
  /* Card width for this menu, where the default track is wider than its cards
     need. Everything else about the card is shared, so the art keeps the same
     shape and only the scale changes. Defaults to CARD_TRACK. */
  cardTrack?: number;
  /* How the groups lay their items out.
       "cards" (default) sits them side by side, each with its preview art. Good
         for a handful of destinations you want to show rather than name.
       "list"  stacks them down a column, title only. A menu with eleven items
         has no horizontal room for art at any sane width, and a name is enough
         when the reader already knows what they are looking for. */
  layout?: "cards" | "list";
} & ({ children: NavDropdownChild[]; groups?: never } | { groups: NavGroup[]; children?: never });

export type NavItem = NavLeaf | NavDropdown;

/* Both shapes flattened, for the callers that only care about the destinations:
   the panel's width maths, the active-route test, and the mobile tray. */
export function dropdownChildren(item: NavDropdown): NavDropdownChild[] {
  return item.groups ? item.groups.flatMap((group) => group.children) : item.children;
}

/* The groups to render. An ungrouped menu is one unlabelled group, so the markup
   below has a single path through it rather than a branch. Exported for the
   mobile tray, which lists a long menu's groups as sections of their own. */
export function dropdownGroups(item: NavDropdown): NavGroup[] {
  return item.groups ?? [{ label: "", children: item.children }];
}

/* The groups folded into the columns they actually occupy. A group marked
   `stacked` joins the column before it, so the panel is as wide as its columns
   rather than as its groups. */
function dropdownColumns(item: NavDropdown): NavGroup[][] {
  const columns: NavGroup[][] = [];
  for (const group of dropdownGroups(item)) {
    if (group.stacked && columns.length > 0) columns[columns.length - 1].push(group);
    else columns.push([group]);
  }
  return columns;
}

export const PRIMARY_SITE_NAV_ITEMS: NavItem[] = [
  {
    title: "Product",
    cardTrack: 200,
    groups: [
      {
        label: "Open source",
        children: [
          {
            title: "OpenUI",
            description: "The open standard for generative UI.",
            href: "/",
          },
        ],
      },
      {
        label: "Cloud",
        children: [
          {
            title: "Gateway",
            description: "One endpoint for generative UI across every model.",
            href: "/cloud/gateway",
          },
          {
            title: "Observability",
            description: "Product analytics and user insights for AI agents.",
            href: "/cloud/observability",
            tag: "Early access",
          },
        ],
      },
    ],
  },
  {
    title: "Resources",
    layout: "list",
    /* The longest title ("Community projects") measures 153px unwrapped; the row
       adds 6px padding, a 24px tile, an 8px gap and 6px padding to that. 200
       clears it with a little slack and keeps every row on one line. */
    cardTrack: 200,
    groups: [
      {
        label: "Demos",
        children: [
          {
            title: "Compare",
            description: "See how AI apps look with and without OpenUI",
            href: "/compare",
            icon: ArrowsOutLineHorizontal,
          },
          {
            title: "OpenUI Chat",
            description: "A ChatGPT-like assistant powered by OpenUI",
            href: "/chat",
            icon: ChatCenteredText,
          },
          {
            title: "AI Dashboards",
            description: "A demo built on GitHub data that answers with a dashboard",
            href: "/demo/github",
            icon: ChartPieSlice,
          },
          {
            title: "OpenUI vs JSON",
            description:
              "Compare OpenUI Lang with JSON-based UI generation: 3× faster with up to 67% fewer tokens.",
            href: "/demos",
            icon: Code,
          },
        ],
      },
      {
        label: "Lab projects",
        children: [
          {
            title: "OpenClaw OS",
            description: "A power-packed workspace for your OpenClaw agents",
            href: "/openclaw-os",
            icon: Monitor,
          },
          {
            title: "AppLess",
            description: "An open-source concept for an OS without any apps",
            href: "https://github.com/thesysdev/appless",
            newTab: true,
            icon: DeviceMobileCamera,
          },
          {
            title: "By community",
            description: "Tools, packages, plugins, and demos from the community",
            href: "/lab",
            icon: Users,
          },
        ],
      },
      {
        label: "Tools",
        children: [
          /* Both Tools rows point into the developer tools docs, at their own
             sections. Relative, so they stay client-side navigations and resolve
             to openui.com in production rather than pointing previews at live. */
          {
            title: "Debug",
            description: "Reproduce and diagnose how a response is parsed and rendered.",
            href: "/docs/openui-lang/developer-tools#debug",
            icon: Bug,
          },
          {
            title: "Inspect",
            description: "Monitor OpenUI streams, errors, and events in real time.",
            href: "/docs/openui-lang/developer-tools#inspect",
            icon: MagnifyingGlass,
          },
        ],
      },
      {
        label: "Other",
        children: [
          {
            title: "Benchmarks",
            description: "Compare how Generative UI frameworks perform across models",
            href: "/benchmarks",
            icon: PresentationChart,
          },
          {
            title: "Pricing",
            description: "OpenUI, Gateway, and Observability pricing",
            href: "/pricing",
            icon: CreditCard,
          },
          {
            title: "Blogs",
            description:
              "Product updates, deep dives, and notes on building generative UI from our team.",
            href: "/blog",
            icon: Book,
          },
          /* No /integrations route exists yet, here or on main. */
          {
            title: "Integrations",
            description:
              "How OpenUI integrates easily with your AI frameworks, UI libraries, SDKs etc.",
            href: "/integrations",
            icon: PlugsConnected,
          },
        ],
      },
    ],
  },
  { title: "Documentation", href: "/docs", newTab: false },
  /* Deliberately the same destination as Resources > Research > Benchmarks. Up
     here it is a promotion, badged while it is still new; down there it is
     filed where someone browsing would look for it. Drop one of the two once
     the launch is over. */
  { title: "Benchmarks", href: "/benchmarks", newTab: false, badge: "New" },
  // Temporarily hidden — Agent Interface isn't ready to share yet. Restore when ready:
  // { title: "Agent Interface", href: "/agent-interface", newTab: false, badge: "New" },
];

/* Either shape counts: a menu carries cards directly, or in labelled groups. A
   leaf carries neither, and is the only kind with an href. */
export function isNavDropdown(item: NavItem): item is NavDropdown {
  return "children" in item || "groups" in item;
}

/* Hoisted: the layout effect reads this, and a fresh array each render would
   make it a dependency and re-run the placement on every render. */
const DROPDOWNS = PRIMARY_SITE_NAV_ITEMS.filter(isNavDropdown);

/* Panel geometry, mirrored from .viewportContent in the stylesheet. Kept in
   sync by hand because the natural width has to be known before layout. */
const CARD_TRACK = 232;
const PANEL_GAP = 20;
const PANEL_PADDING = 20;
/* Between two labelled groups, where the gap has to read as a division rather
   than as the spacing between neighbouring cards. One step up from PANEL_GAP. */
const GROUP_GAP = 24;
/* Smallest gap left between the panel and either edge of the window. */
const VIEWPORT_MARGIN = 16;
/* Forgiveness around the nav+panel box before the menu counts as left. */
const POINTER_SLACK = 12;
/* How long the pointer must rest on a neighbouring nav link before an open menu
   closes. Long enough that crossing one on the way to a card doesn't count,
   short enough that settling on it closes right away. */
const NEIGHBOUR_DWELL_MS = 150;
/* How long the banner holds after the pointer leaves a row. Long enough that
   crossing the gap between two rows never blanks it, and that leaving the menu
   does not yank it away mid-read. Entering another row cancels the wait, so the
   line swaps straight over rather than clearing first. */
const BANNER_LINGER_MS = 400;

/* What a row or card shows, independent of whether it is a link. */
function renderBody(child: NavDropdownChild, layout: "cards" | "list") {
  return (
    <>
      {layout === "list" && child.icon && (
        /* Both glyphs are mounted and the tile cross-fades between them, so the
           swap costs no layout and nothing shifts under the pointer. Same arrow
           split the cards use: up-right leaves the site, right stays on it. */
        <span className={styles.listIcon} aria-hidden="true">
          <child.icon className={styles.listGlyph} size={14} />
          <span className={styles.listArrow}>
            {child.newTab ? (
              <ArrowUpRight size={13} weight="bold" />
            ) : (
              <ArrowRight size={13} weight="bold" />
            )}
          </span>
        </span>
      )}
      {layout === "cards" && child.preview && (
        <span className={styles.dropdownPreview}>
          {/* Both variants render; CSS reveals the one matching the theme, so
              there's no hydration flash on first paint. */}
          <img
            src={child.preview.light}
            alt=""
            aria-hidden="true"
            width={852}
            height={480}
            loading="lazy"
            draggable={false}
            className={`${styles.dropdownPreviewImage} ${styles.dropdownPreviewLight}`}
          />
          <img
            src={child.preview.dark}
            alt=""
            aria-hidden="true"
            width={852}
            height={480}
            loading="lazy"
            draggable={false}
            className={`${styles.dropdownPreviewImage} ${styles.dropdownPreviewDark}`}
          />
        </span>
      )}
      <span className={styles.dropdownText}>
        <span className={styles.dropdownTitleRow}>
          <span className={styles.dropdownTitle}>{child.title}</span>
          {/* No arrow: it would point at a destination that is not there yet. */}
          {!child.comingSoon && (
            <span className={styles.dropdownArrow} aria-hidden="true">
              {child.newTab ? (
                <ArrowUpRight size={12} weight="bold" />
              ) : (
                <ArrowRight size={12} weight="bold" />
              )}
            </span>
          )}
        </span>
        {layout === "cards" && child.description && (
          <span className={styles.dropdownDescription}>{child.description}</span>
        )}
        {/* Under the copy rather than beside the title: it is the last thing to
            read, once you know what the thing is. */}
        {child.comingSoon ? (
          <ItemTag label="Coming soon" />
        ) : child.tag ? (
          <ItemTag label={child.tag} />
        ) : null}
      </span>
    </>
  );
}

/* The status chip under a card's copy. Carries no behaviour of its own: whether
   the item is clickable is decided by `comingSoon`, not by this. */
function ItemTag({ label }: { label: string }) {
  return <span className={styles.itemTag}>{label}</span>;
}

function DropdownCard({
  child,
  onNavigate,
  layout = "cards",
  onHover,
}: {
  child: NavDropdownChild;
  onNavigate: () => void;
  layout?: "cards" | "list";
  onHover?: (child: NavDropdownChild | null) => void;
}) {
  const className =
    layout === "list"
      ? styles.listItem
      : /* A card with art shows hover by zooming it. One with none has
           nothing to move, so it takes a fill instead. */
        `${styles.dropdownItem} ${child.preview ? "" : styles.dropdownItemPlain}`.trim();

  /* Nothing to navigate to yet, so it is not a link: no href, no tab stop, and
     none of the hover behaviour that would promise a click. */
  if (child.comingSoon) {
    return (
      <span className={`${className} ${styles.itemMuted}`.trim()} role="menuitem" aria-disabled>
        {renderBody(child, layout)}
      </span>
    );
  }

  return (
    <Link
      className={className}
      href={child.href}
      role="menuitem"
      onClick={onNavigate}
      {...(onHover
        ? {
            onPointerEnter: () => onHover(child),
            onPointerLeave: () => onHover(null),
            /* Focus is the keyboard's version of resting on a row. */
            onFocus: () => onHover(child),
            onBlur: () => onHover(null),
          }
        : {})}
      {...(child.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {renderBody(child, layout)}
    </Link>
  );
}

/**
 * The dropdowns share a single panel ("viewport") so that moving between two
 * menus morphs one box — it slides to the new trigger and resizes to the new
 * content — instead of cross-fading two separate panels. Every menu's content
 * is always mounted (inert when inactive) so the box can be measured before it
 * animates, and so the artwork isn't re-fetched on each open.
 *
 * The box's geometry is written straight to the DOM rather than held in state:
 * it's derived from measurements that only exist after layout, and round-tripping
 * it through React would cost an extra render on every hover.
 */
export function SitePrimaryNav() {
  const pathname = usePathname();

  const [active, setActive] = useState<string | null>(null);
  /* The row under the pointer. Drives the banner, and with it the panel's
     height: the layout effect re-measures whenever this changes. */
  const [hovered, setHovered] = useState<NavDropdownChild | null>(null);

  // Close on navigation. The link's own onClick covers the common case, but a
  // route change can also come from elsewhere (back/forward, a nested link), and
  // the pointer often never leaves the nav, so nothing else would close it.
  // Adjusting state during render is React's sanctioned pattern here — an effect
  // would paint the stale open menu for a frame first.
  const [navigatedFrom, setNavigatedFrom] = useState(pathname);
  if (pathname !== navigatedFrom) {
    setNavigatedFrom(pathname);
    setActive(null);
  }

  const navRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const bannerTimerRef = useRef<number | null>(null);

  const wasOpenRef = useRef(false);
  const watcherRef = useRef<((event: PointerEvent) => void) | null>(null);
  const neighbourTimerRef = useRef<number | null>(null);

  // Neither the watcher nor a pending close may outlive the component.
  useEffect(
    () => () => {
      if (watcherRef.current) document.removeEventListener("pointermove", watcherRef.current);
      if (neighbourTimerRef.current !== null) window.clearTimeout(neighbourTimerRef.current);
      if (bannerTimerRef.current !== null) window.clearTimeout(bannerTimerRef.current);
    },
    [],
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (!active) {
      viewport.classList.remove(styles.viewportMorph);
      wasOpenRef.current = false;
      return;
    }

    const content = contentRefs.current[active];
    const trigger = triggerRefs.current[active];
    const nav = navRef.current;
    const item = DROPDOWNS.find((entry) => entry.title === active);
    if (!content || !trigger || !nav || !item) return;

    const place = () => {
      const navRect = nav.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;

      // Natural width is arithmetic, not measured: measuring would need the
      // content laid out unconstrained first, and it can't be — its columns are
      // sized from the width set below.
      //
      // Counted from the data rather than from content.children, which holds
      // groups now: a grouped menu would otherwise be measured as if it had one
      // card per group. Cards carry PANEL_GAP between them and GROUP_GAP where a
      // group ends, which is why the two gaps are counted apart.
      const cards = dropdownChildren(item).length;
      const groups = dropdownColumns(item).length;
      const track = item.cardTrack ?? CARD_TRACK;
      // A list stacks its items, so each group is a single track wide however
      // many it holds. Cards sit side by side, so every one of them takes one.
      const tracks = item.layout === "list" ? groups : cards;
      const natural =
        PANEL_PADDING * 2 +
        tracks * track +
        (item.layout === "list" ? 0 : PANEL_GAP * (cards - groups)) +
        GROUP_GAP * (groups - 1);
      const width = Math.min(natural, viewportWidth - VIEWPORT_MARGIN * 2);

      // Set the width first so the cards reflow, then read the height they
      // settled at — narrower columns wrap the descriptions onto more lines.
      content.style.width = `${width}px`;
      const height = content.offsetHeight;

      // Centred on the window, not on the trigger that opened it. Both panels are
      // wide enough that hanging them off their own link only pushed them into an
      // edge clamp, and a menu that lands in the same place every time reads as
      // one surface rather than as a box chasing the pointer.
      const centred = (viewportWidth - width) / 2;
      const left = Math.min(
        Math.max(centred, VIEWPORT_MARGIN),
        viewportWidth - width - VIEWPORT_MARGIN,
      );

      viewport.style.width = `${width}px`;
      viewport.style.height = `${height}px`;
      viewport.style.translate = `${left - navRect.left}px 0`;
    };

    const openingFromClosed = !wasOpenRef.current;
    // Opening from closed must not animate — the box would otherwise grow from
    // whatever geometry the previously-open menu left behind.
    if (openingFromClosed) viewport.classList.remove(styles.viewportMorph);

    place();

    // Keep it inside the viewport if the window changes while the menu is open.
    window.addEventListener("resize", place);

    if (openingFromClosed) {
      // Flush the geometry above while transitions are still disarmed, then arm
      // them for subsequent menu switches. Reading a layout property forces the
      // style recalc synchronously, so this needs no rAF — which matters because
      // rAF doesn't fire in a backgrounded tab and would leave the morph unarmed.
      void viewport.offsetWidth;
      viewport.classList.add(styles.viewportMorph);
      wasOpenRef.current = true;
    }

    return () => window.removeEventListener("resize", place);
  }, [active, hovered]);

  const stopWatchingPointer = () => {
    if (watcherRef.current) {
      document.removeEventListener("pointermove", watcherRef.current);
      watcherRef.current = null;
    }
  };

  const cancelNeighbourClose = () => {
    if (neighbourTimerRef.current !== null) {
      window.clearTimeout(neighbourTimerRef.current);
      neighbourTimerRef.current = null;
    }
  };

  const cancelBannerClear = () => {
    if (bannerTimerRef.current !== null) {
      window.clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  };

  const onRowHover = (child: NavDropdownChild | null) => {
    cancelBannerClear();
    if (child) setHovered(child);
    else bannerTimerRef.current = window.setTimeout(() => setHovered(null), BANNER_LINGER_MS);
  };

  const close = () => {
    stopWatchingPointer();
    cancelNeighbourClose();
    cancelBannerClear();
    setActive(null);
    setHovered(null);
  };

  /**
   * Docs and Blogs flank the dropdowns, so the pointer crosses one whenever it
   * reaches diagonally for a card at either end of an open panel. Closing on
   * entry killed the menu mid-reach; not closing at all left it hanging while
   * the pointer sat on a different nav item. So the close waits on dwell —
   * crossing is over in a few frames, settling isn't.
   */
  const scheduleNeighbourClose = () => {
    cancelNeighbourClose();
    neighbourTimerRef.current = window.setTimeout(close, NEIGHBOUR_DWELL_MS);
  };

  /**
   * The panel is far wider than the nav and hangs below it, so moving from a
   * trigger diagonally towards a card at either end leaves the nav's box long
   * before reaching the panel — the pointer crosses open space beside the nav
   * that belongs to neither.
   *
   * So leaving the nav doesn't close anything by itself. It starts watching the
   * pointer, and the menu closes only once the pointer is outside the box that
   * encloses both the nav and the open panel. Every path from a trigger to any
   * card stays inside that box, however diagonal, at whatever speed — there's no
   * delay to outrun.
   *
   * (A bridge element over that space would have been simpler, but at this width
   * it would sit on top of the header's logo and buttons and swallow their
   * clicks.)
   */
  const watchPointer = () => {
    stopWatchingPointer();
    const onMove = (event: PointerEvent) => {
      const nav = navRef.current;
      const panel = viewportRef.current;
      if (!nav || !panel) return;
      const a = nav.getBoundingClientRect();
      const b = panel.getBoundingClientRect();
      const inside =
        event.clientX >= Math.min(a.left, b.left) - POINTER_SLACK &&
        event.clientX <= Math.max(a.right, b.right) + POINTER_SLACK &&
        event.clientY >= Math.min(a.top, b.top) - POINTER_SLACK &&
        event.clientY <= Math.max(a.bottom, b.bottom) + POINTER_SLACK;
      if (!inside) close();
    };
    watcherRef.current = onMove;
    document.addEventListener("pointermove", onMove);
  };

  return (
    <nav
      className={styles.nav}
      ref={navRef}
      onPointerLeave={watchPointer}
      /* pointerover, not pointerenter: enter only fires crossing the nav's own
         boundary, so coming back in over a trigger or the panel — both
         descendants — would leave the watcher running. over bubbles from any
         descendant, so every way back in stops it. */
      onPointerOver={stopWatchingPointer}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      {PRIMARY_SITE_NAV_ITEMS.map((item) => {
        if (isNavDropdown(item)) {
          /* The home page is one of Product's cards, so a startsWith test on "/"
             would light Product up on every route. An exact match for it, prefix
             for the rest. */
          const isActive = dropdownChildren(item).some((child) =>
            child.href === "/" ? pathname === "/" : pathname.startsWith(child.href),
          );
          const isOpen = active === item.title;

          return (
            <div
              className={styles.dropdown}
              key={item.title}
              onPointerEnter={() => {
                setActive(item.title);
                cancelBannerClear();
                setHovered(null);
              }}
            >
              <button
                type="button"
                className={`${styles.link} ${styles.dropdownTrigger} ${
                  isActive ? styles.linkActive : ""
                } ${isOpen ? styles.dropdownTriggerOpen : ""}`.trim()}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                ref={(node) => {
                  triggerRefs.current[item.title] = node;
                }}
                onFocus={() => setActive(item.title)}
                onClick={() => setActive(isOpen ? null : item.title)}
              >
                {item.title}
              </button>
            </div>
          );
        }

        const isActive = pathname.startsWith(item.href);
        const badge = "badge" in item ? item.badge : undefined;

        return (
          <Link
            className={`${styles.link} ${isActive ? styles.linkActive : ""}`.trim()}
            href={item.href}
            key={item.href}
            onPointerEnter={scheduleNeighbourClose}
            onPointerLeave={cancelNeighbourClose}
            {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {item.title}
            {badge && <span className={styles.badge}>{badge}</span>}
          </Link>
        );
      })}

      <div className={styles.viewport} data-open={active ? "true" : "false"} ref={viewportRef}>
        {DROPDOWNS.map((item) => (
          <div
            className={styles.viewportContent}
            key={item.title}
            data-active={active === item.title ? "true" : "false"}
            // Inactive menus stay mounted for measurement but must not be
            // reachable by pointer, screen reader, or tab order.
            inert={active !== item.title}
            ref={(node) => {
              contentRefs.current[item.title] = node;
            }}
            role="menu"
            aria-label={item.title}
          >
            <div className={styles.columns}>
              {dropdownColumns(item).map((column) => (
                <div
                  className={styles.column}
                  key={column[0].label || item.title}
                  /* A list column is one track whatever it stacks. A card group's
                     share follows its card count, and its inner gaps come off the
                     top so every card lands on the same track. */
                  style={
                    item.layout === "list"
                      ? { flexGrow: 1, flexBasis: 0 }
                      : {
                          flexGrow: column[0].children.length,
                          flexBasis: (column[0].children.length - 1) * PANEL_GAP,
                        }
                  }
                >
                  {column.map((group) => (
                    <div
                      className={`${styles.group} ${
                        item.layout === "list" ? styles.groupInList : ""
                      }`.trim()}
                      key={group.label || item.title}
                      {...(group.label ? { role: "group", "aria-label": group.label } : {})}
                    >
                      {group.label && <p className={styles.groupLabel}>{group.label}</p>}
                      <div
                        className={item.layout === "list" ? styles.groupList : styles.groupCards}
                      >
                        {group.children.map((child) => (
                          <DropdownCard
                            child={child}
                            key={child.href}
                            onNavigate={close}
                            layout={item.layout}
                            onHover={item.layout === "list" ? onRowHover : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Only mounted while a row is hovered, which is what grows the
                panel: the layout effect re-measures on `hovered`, writes the new
                height, and the box animates to it. */}
            {item.layout === "list" && hovered?.description && (
              <div className={styles.banner}>
                <Asterisk className={styles.bannerIcon} size={13} weight="bold" />
                <span>{hovered.description}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
