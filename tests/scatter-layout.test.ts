import test from "node:test";
import assert from "node:assert/strict";
import {
  spreadScatter,
  scatterDomains,
  scatterHeight,
} from "../src/lib/scatterLayout.ts";
import type { RateCommitmentPoint } from "../src/lib/rateCommitment.ts";
const point = (id: number): RateCommitmentPoint => ({
  customerId: String(id),
  name: `Example ${id}`,
  saunaType: id % 2 ? "Outdoor Traditional" : "Indoor Infrared",
  status: id % 3 ? "current" : "historical",
  monthlyRate: 400,
  committedValue: 4800,
  installedOn: null,
  unverified: false,
});
for (const width of [320, 850, 1400]) {
  test(`dense cluster separates across types and statuses at width ${width}`, () => {
    const input = Array.from({ length: 90 }, (_, i) => point(i));
    // Include nearby values, a boundary cluster, and a distant isolated point.
    input[0].monthlyRate = 401;
    input[1].committedValue = 4801;
    input[2].monthlyRate = 0;
    input[2].committedValue = 0;
    const before = structuredClone(input),
      domain = scatterDomains(input);
    const result = spreadScatter(input, width),
      w = width - 106,
      h = scatterHeight - 90;
    assert.equal(result.length, input.length);
    assert.deepEqual(input, before);
    assert.deepEqual(spreadScatter([...input].reverse(), width), result);
    const xy = result.map((p) => ({
      x: (p.plotCommitment / domain.x) * w,
      y: (1 - p.plotRate / domain.y) * h,
    }));
    for (let i = 0; i < result.length; i++) {
      assert.equal(
        result[i].monthlyRate,
        input.find((p) => p.customerId === result[i].customerId)!.monthlyRate,
      );
      assert.equal(
        result[i].committedValue,
        input.find((p) => p.customerId === result[i].customerId)!
          .committedValue,
      );
      assert.ok(xy[i].x >= 9.99 && xy[i].x <= w - 9.99);
      assert.ok(xy[i].y >= 9.99 && xy[i].y <= h - 9.99);
      for (let j = 0; j < i; j++)
        assert.ok(Math.hypot(xy[i].x - xy[j].x, xy[i].y - xy[j].y) >= 17.99);
    }
  });
}
test("isolated points retain exact positions and empty chart is safe", () => {
  const result = spreadScatter([point(1)], 850)[0];
  assert.equal(result.plotCommitment, 4800);
  assert.ok(Math.abs(result.plotRate - 400) < 1e-8);
  assert.deepEqual(spreadScatter([], 850), []);
});
