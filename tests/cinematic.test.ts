import { test } from "node:test";
import assert from "node:assert/strict";
import { getCinematicFrame, createScrollSignal } from "../src/lib/cinematic";
test("scroll poses are deterministic and reverse exactly to the initial composition", () => {
  const initial = getCinematicFrame(0);
  const exploded = getCinematicFrame(0.35);
  const final = getCinematicFrame(1);
  assert.equal(initial.pieces.length, 24);
  assert.notDeepEqual(initial.pieces, exploded.pieces);
  assert.notDeepEqual(exploded.pieces, final.pieces);
  assert.notDeepEqual(initial.camera, exploded.camera);
  for (const p of [1, 0.75, 0.5, 0.25, 0]) getCinematicFrame(p);
  assert.deepEqual(getCinematicFrame(0), initial);
  assert.equal(final.phase, 5);
});
test("choreography stays finite across every scene boundary and clamps input", () => {
  for (let i = 0; i <= 1000; i++) {
    const frame = getCinematicFrame(i / 1000);
    assert.ok(
      [
        ...frame.camera,
        ...frame.target,
        ...frame.group,
        ...frame.rotation,
        ...frame.pieces.flatMap((p) => [...p.position, ...p.rotation, p.scale]),
      ].every(Number.isFinite),
    );
  }
  assert.deepEqual(getCinematicFrame(-1), getCinematicFrame(0));
  assert.deepEqual(getCinematicFrame(2), getCinematicFrame(1));
});
test("mobile quality reduces geometry count and reduced motion has a single static pose", () => {
  assert.equal(getCinematicFrame(0.3, 6).pieces.length, 18);
  assert.deepEqual(
    getCinematicFrame(0, 6, true),
    getCinematicFrame(1, 6, true),
  );
});
test("scroll signal delivers latest progress and supports complete cleanup", () => {
  const signal = createScrollSignal();
  const values: number[] = [];
  const unsubscribe = signal.subscribe((v) => values.push(v));
  signal.set(0.5);
  signal.set(1);
  unsubscribe();
  signal.set(0);
  assert.deepEqual(values, [0, 0.5, 1]);
  assert.equal(signal.get(), 0);
});
