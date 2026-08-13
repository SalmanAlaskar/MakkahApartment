// Single source of truth for reservation money math: gross -> fee -> expense -> net -> per-partner
// shares. Used by both create and edit server actions; display pages only ever sum stored
// share_amount rows, never re-run this.

export type FeeMethod = "flat_amount" | "percent_of_gross";

export interface FeeInput {
  grossAmount: number;
  feeMethod: FeeMethod;
  feeAmount?: number; // required when feeMethod === "flat_amount"
  feePercent?: number; // required when feeMethod === "percent_of_gross"
  expenseAmount: number;
}

export interface FeeResult {
  feeAmount: number;
  feePercent: number | null;
  netAmount: number;
}

export interface PartnerSnapshot {
  partnerId: string;
  ownershipPercent: number;
}

export interface ShareResult {
  partnerId: string;
  ownershipPercentSnapshot: number;
  shareAmount: number;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeFee(input: FeeInput): FeeResult {
  const feeAmount =
    input.feeMethod === "percent_of_gross"
      ? round2(input.grossAmount * ((input.feePercent ?? 0) / 100))
      : round2(input.feeAmount ?? 0);

  const feePercent = input.feeMethod === "percent_of_gross" ? input.feePercent ?? 0 : null;

  // net_amount can be negative: a reservation's cleaning/maintenance costs occasionally exceed
  // the rent collected (seen in the real tracking sheet) — that loss still needs to divide
  // across partners, so this is never clamped to zero.
  const netAmount = round2(input.grossAmount - feeAmount - round2(input.expenseAmount));

  return { feeAmount, feePercent, netAmount };
}

// Splits netAmount across partners by ownership %. The LAST partner in the array absorbs the
// rounding remainder so shareAmount always sums exactly to netAmount (no cent drift). Callers
// must pass partners in a stable order (e.g. by display_order) so this is deterministic.
export function computeShares(netAmount: number, partners: PartnerSnapshot[]): ShareResult[] {
  if (partners.length === 0) return [];

  const net = round2(netAmount);
  const results: ShareResult[] = [];
  let allocated = 0;

  partners.forEach((partner, index) => {
    const isLast = index === partners.length - 1;
    const amount = isLast ? round2(net - allocated) : round2((net * partner.ownershipPercent) / 100);

    if (!isLast) allocated = round2(allocated + amount);

    results.push({
      partnerId: partner.partnerId,
      ownershipPercentSnapshot: partner.ownershipPercent,
      shareAmount: amount,
    });
  });

  return results;
}
