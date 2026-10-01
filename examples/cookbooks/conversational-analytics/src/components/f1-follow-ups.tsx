// OpenUI's FollowUpBlock and FollowUpItem, drawn as the F1 picture cards (ChatFollowUpCards)
// instead of a "Related Queries" list. Same names and the same FollowUpItem(text) call, plus an
// optional subject that tells the card what to paint. Clicking a card asks its text next.
import { defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ChatFollowUpCards, type FollowUpCard } from "./chat/chat-follow-up-cards";
import { ChatFollowUps } from "./chat/chat-follow-ups";
import { findCircuit, findDriver, findTeam } from "./f1-genui";
import "./f1-spotlight.css";

/** "VER", "VER vs RUS", "Ferrari", "Monza" or "lap 31" → the card for it, or null for plain text. */
export function cardFor(text: string, subject: string | undefined): FollowUpCard | null {
  const s = subject?.trim();
  if (!s) return null;
  // A bare number is a lap unless it is a car number ("16" is Leclerc).
  const lap = s.match(/^lap\s*(\d+)$/i) ?? s.match(/^(\d+)$/);
  if (lap && !findDriver(s)) return { text, kind: "lap", lap: Number(lap[1]) };
  const pair = s.split(/\s*(?:\bvs\.?\b|,|&|\/)\s*/i).filter(Boolean);
  if (pair.length === 2) {
    const [a, b] = pair.map((p) => findDriver(p));
    if (a && b) return { text, kind: "compare", drivers: [a.acronym, b.acronym] };
  }
  const driver = findDriver(s);
  if (driver) return { text, kind: "driver", driver: driver.acronym };
  const team = findTeam(s);
  if (team) return { text, kind: "team", team };
  const circuit = findCircuit(s);
  if (circuit) return { text, kind: "circuit", circuit: circuit.location };
  return null;
}

export const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: z.object({ text: z.string(), subject: z.string().optional() }),
  description:
    'Clickable follow-up question, drawn as a picture card; clicking sends text as the next message. subject: what the card paints: a driver code ("LEC"), two codes for a head to head ("LEC vs RUS"), a team ("Ferrari"), a circuit place ("Monza") or a lap ("lap 31").',
  // Draws nothing itself: FollowUpBlock reads every item's props and lays the cards out together.
  component: () => null,
});

type ItemNode = { props?: { text?: unknown; subject?: unknown } } | null | undefined;

export const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: z.object({ items: z.array(FollowUpItem.ref) }),
  description: "Two or three follow-up question cards placed at the end of a response.",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const items = ((props.items ?? []) as ItemNode[])
      .map((item) => ({
        text: String(item?.props?.text ?? "").trim(),
        subject: item?.props?.subject == null ? undefined : String(item.props.subject),
      }))
      .filter((item) => item.text);
    const cards = items.map((item) => cardFor(item.text, item.subject));
    const pictured = cards.filter((c): c is FollowUpCard => c !== null);
    const plain = items.filter((_, i) => cards[i] === null).map((item) => item.text);
    const pick = (text: string) => triggerAction(text);
    return (
      <>
        <ChatFollowUpCards items={pictured} onPick={pick} />
        {/* A question with no subject to paint stays a plain row, labelled only when it stands alone. */}
        <ChatFollowUps items={plain} label={pictured.length ? null : "Next lap"} onPick={pick} />
      </>
    );
  },
});

/* Spotlight: the same picture cards as display tiles inside an answer. Each shows its subject's
   picture band, the tag the subject gives it, and one short statement. No send arrow and no click,
   so they never read as follow-ups. */

export const SpotlightItem = defineComponent({
  name: "SpotlightItem",
  props: z.object({ text: z.string(), subject: z.string() }),
  description:
    'One display tile: text is a short statement about the subject, not a question. subject: a driver code ("LEC"), two codes ("LEC vs RUS"), a team ("Ferrari"), a circuit place ("Monza") or a lap ("lap 31").',
  component: () => null,
});

export const Spotlight = defineComponent({
  name: "Spotlight",
  props: z.object({ items: z.array(SpotlightItem.ref) }),
  description: "One to three picture tiles that make a point expressive inside an answer. Display only, not clickable.",
  component: ({ props }) => {
    // Unlike follow-ups, a tile whose subject matches nothing is dropped: it would have no picture.
    const cards = ((props.items ?? []) as ItemNode[])
      .map((item) => cardFor(String(item?.props?.text ?? "").trim(), item?.props?.subject == null ? undefined : String(item.props.subject)))
      .filter((c): c is FollowUpCard => c !== null && !!c.text)
      .slice(0, 3);
    return (
      <div className="f1-spotlight">
        <ChatFollowUpCards items={cards} label={null} />
      </div>
    );
  },
});
