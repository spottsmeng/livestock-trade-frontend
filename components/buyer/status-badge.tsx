import { Badge } from "@/components/ui/badge";
import { InfoTooltipWrap } from "@/components/ui/info-tooltip";
import { strings } from "@/lib/strings";
import type { BidStatus } from "@/lib/buyer/bidcheck";

// §15.4 — colour is never the sole signal: always paired with an icon and
// a text label, identical everywhere this status appears.
const ICON: Record<BidStatus, string> = { PASS: "✓", CLOSE: "▲", BREACH: "⛔" };
const VARIANT: Record<BidStatus, "pass" | "close" | "breach"> = { PASS: "pass", CLOSE: "close", BREACH: "breach" };
const LABEL: Record<BidStatus, string> = {
  PASS: strings.buyer.bidCheck.pass,
  CLOSE: strings.buyer.bidCheck.close,
  BREACH: strings.buyer.bidCheck.breach,
};

export function StatusBadge({ status, className }: { status: BidStatus; className?: string }) {
  const { what, how } = strings.buyer.statusBadge.tooltip;
  return (
    <InfoTooltipWrap what={what} how={how}>
      <Badge variant={VARIANT[status]} className={className} tabIndex={0}>
        {ICON[status]} {LABEL[status]}
      </Badge>
    </InfoTooltipWrap>
  );
}
