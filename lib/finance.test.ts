import { describe, expect, it } from "vitest";
import { computeFee, computeShares } from "./finance";

const PARTNERS = [
  { partnerId: "salman", ownershipPercent: 42.928111 },
  { partnerId: "hakeem", ownershipPercent: 42.928111 },
  { partnerId: "abdulaziz", ownershipPercent: 9.429185 },
  { partnerId: "basmah", ownershipPercent: 4.714593 },
];

describe("computeFee", () => {
  it("computes net from a flat commission amount, matching real-world usage", () => {
    const result = computeFee({
      grossAmount: 3000,
      feeMethod: "flat_amount",
      feeAmount: 500,
      expenseAmount: 205,
    });
    expect(result.feeAmount).toBe(500);
    expect(result.feePercent).toBeNull();
    expect(result.netAmount).toBe(2295);
  });

  it("computes fee from a percentage of gross", () => {
    const result = computeFee({
      grossAmount: 1000,
      feeMethod: "percent_of_gross",
      feePercent: 15,
      expenseAmount: 0,
    });
    expect(result.feeAmount).toBe(150);
    expect(result.feePercent).toBe(15);
    expect(result.netAmount).toBe(850);
  });

  it("allows a negative net when expenses exceed rent minus commission", () => {
    const result = computeFee({
      grossAmount: 350,
      feeMethod: "flat_amount",
      feeAmount: 50,
      expenseAmount: 750,
    });
    expect(result.netAmount).toBe(-450);
  });
});

describe("computeShares", () => {
  it("splits net exactly across the 4 confirmed partner percentages with zero drift", () => {
    const shares = computeShares(2295, PARTNERS);
    const sum = shares.reduce((total, share) => total + share.shareAmount, 0);
    expect(Math.round(sum * 100) / 100).toBe(2295);
    expect(shares).toHaveLength(4);
  });

  it("distributes a negative net (a loss) across partners the same way", () => {
    const shares = computeShares(-450, PARTNERS);
    const sum = shares.reduce((total, share) => total + share.shareAmount, 0);
    expect(Math.round(sum * 100) / 100).toBe(-450);
  });

  it("returns an empty array when there are no partners", () => {
    expect(computeShares(1000, [])).toEqual([]);
  });

  it("has the last partner absorb the rounding remainder", () => {
    const shares = computeShares(100, [
      { partnerId: "a", ownershipPercent: 33.333333 },
      { partnerId: "b", ownershipPercent: 33.333333 },
      { partnerId: "c", ownershipPercent: 33.333334 },
    ]);
    const sum = shares.reduce((total, share) => total + share.shareAmount, 0);
    expect(Math.round(sum * 100) / 100).toBe(100);
  });
});
