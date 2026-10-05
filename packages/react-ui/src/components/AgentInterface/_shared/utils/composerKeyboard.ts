/**
 * The subset of a `keydown` event the composers need to decide whether `Enter`
 * submits. React's `KeyboardEvent<HTMLTextAreaElement>` satisfies it
 * structurally, so call sites pass the synthetic event straight through and
 * tests can build a plain object.
 */
export interface ComposerKeyDownEvent {
  key: string;
  shiftKey: boolean;
  keyCode: number;
  nativeEvent: { isComposing: boolean };
}

/**
 * Safari and older Chromium report `keyCode` 229 for a keydown consumed by an
 * open IME composition, and do not always have `isComposing` set on that same
 * event. Checking both covers each browser's timing.
 */
const IME_KEY_CODE = 229;

/**
 * Whether an `Enter` keydown in a composer textarea should send the draft.
 *
 * `Enter` sends and `Shift+Enter` inserts a newline — except while an IME
 * composition is open, where `Enter` belongs to the IME (it commits the
 * conversion candidate) and must not reach the composer.
 *
 * Without this guard, Windows Voice Typing holds a composition session open
 * across dictation: a physical `Enter` sends and clears the textarea, the
 * composition then finalizes and fires one more `onChange`, and the dictated
 * text reappears in the box the user just emptied. Every CJK IME hits the same
 * path and sends a half-converted phrase instead of committing it.
 *
 * Consequence, shared with every IME-aware composer: the `Enter` that closes a
 * composition does not send. The next one does.
 */
export const shouldSubmitOnEnter = (event: ComposerKeyDownEvent): boolean => {
  if (event.key !== "Enter" || event.shiftKey) return false;
  return !event.nativeEvent.isComposing && event.keyCode !== IME_KEY_CODE;
};
