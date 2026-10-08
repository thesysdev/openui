import type { ObservabilityEvent } from "@openuidev/observability";
import { EventRow } from "./EventRow";
import { QuotaErrorRow, getQuotaError } from "./QuotaErrorRow";
import { ReactLangStreamEventRow, getReactLangStreamDetail } from "./ReactLangStreamEventRow";

export function InspectEvent({
  event,
  canOpenInDebug,
  onOpenInDebug,
  embedded = false,
  last = false,
}: {
  event: ObservabilityEvent;
  canOpenInDebug: boolean;
  onOpenInDebug: (response: string, libraryId?: string) => void;
  embedded?: boolean;
  last?: boolean;
}) {
  const quotaError = getQuotaError(event);
  if (quotaError) return <QuotaErrorRow info={quotaError} embedded={embedded} last={last} />;
  const stream = getReactLangStreamDetail(event);
  if (stream) {
    return (
      <ReactLangStreamEventRow
        event={event}
        stream={stream}
        canOpenInDebug={canOpenInDebug}
        onOpenInDebug={onOpenInDebug}
        embedded={embedded}
        last={last}
      />
    );
  }
  return <EventRow event={event} embedded={embedded} last={last} />;
}
