import { SpeakerIcon } from "./icons";
import "./chat.css";

/*
 * ChatUserMessage: what you radioed in, set as a team-radio caption. The quoted
 * red uppercase italic style RadioInput used for its old caption, sitting on the
 * right like the driver's side of the conversation.
 */

export type ChatUserMessageProps = {
  text: string;
  /** Who is on the radio. */
  from?: string;
};

export function ChatUserMessage({ text, from = "You" }: ChatUserMessageProps) {
  return (
    <div className="f1c f1c-user">
      <span className="f1c-user__from f1c-label">
        <SpeakerIcon size={18} />
        {from}
      </span>
      <p className="f1c-user__text">“{text}”</p>
    </div>
  );
}
