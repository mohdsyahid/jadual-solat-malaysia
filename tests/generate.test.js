const test = require("node:test");
const assert = require("node:assert");
const path = require("path");

const { toIsoDate, normalizeRecord } = require(path.join(__dirname, "..", "src", "generate.js"));
const zones = require(path.join(__dirname, "..", "src", "zones.js"));

test("zones list is complete and well-formed", () => {
  assert.ok(zones.length >= 60, `expected >= 60 zones, got ${zones.length}`);
  for (const z of zones) {
    assert.match(z.code, /^[A-Z]{3}\d{2}$/);
    assert.ok(z.negeri.length > 0);
    assert.ok(z.daerah.length > 0);
  }
});

test("zone codes are unique", () => {
  const codes = zones.map((z) => z.code);
  assert.strictEqual(new Set(codes).size, codes.length);
});

test("toIsoDate handles JAKIM Malay month names", () => {
  assert.strictEqual(toIsoDate("30-Ogos-2026"), "2026-08-30");
  assert.strictEqual(toIsoDate("01-Jan-2026"), "2026-01-01");
  assert.strictEqual(toIsoDate("05-Mac-2026"), "2026-03-05");
  assert.strictEqual(toIsoDate("17-Mei-2026"), "2026-05-17");
  assert.strictEqual(toIsoDate("09-Dis-2026"), "2026-12-09");
});

test("toIsoDate rejects unknown months", () => {
  assert.throws(() => toIsoDate("30-Foo-2026"));
});

test("normalizeRecord trims times to HH:MM and normalizes date", () => {
  const rec = normalizeRecord({
    hijri: "1448-03-17",
    date: "30-Ogos-2026",
    imsak: "05:50:00", fajr: "06:00:00", syuruk: "07:08:00", dhuha: "07:33:00",
    dhuhr: "13:17:00", asr: "16:26:00", maghrib: "19:21:00", isha: "20:31:00",
  });
  assert.strictEqual(rec.date, "2026-08-30");
  assert.strictEqual(rec.fajr, "06:00");
  assert.strictEqual(rec.maghrib, "19:21");
  assert.strictEqual(Object.keys(rec).length, 10);
});
