import "./chat.css";

/*
 * ChatStartLights: the loader. Five start lights come on one by one while the
 * answer is on its way, then hold. They run once, never loop; with reduced motion
 * they're all on at once. Set out when the answer starts: lights out.
 */

export type ChatStartLightsProps = {
  /** Status line beside the lights. */
  label?: string;
  /** Lights out: all five go dark. */
  out?: boolean;
  /** Time between lights, in ms. */
  step?: number;
};

export function ChatStartLights({ label = "Waiting for the pit wall", out = false, step = 400 }: ChatStartLightsProps) {
  return (
    <div className="f1c f1c-lights" data-state={out ? "out" : "on"} role="status">
      <span className="f1c-lights__gantry" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="f1c-lights__unit">
            <span className="f1c-lights__lamp" style={{ animationDelay: `${(i + 1) * step}ms` }} />
          </span>
        ))}
      </span>
      {label && <span className="f1c-lights__label">{label}</span>}
    </div>
  );
}
