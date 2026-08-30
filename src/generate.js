#!/usr/bin/env node
/**
 * Fetch a year of prayer times for every JAKIM zone and write them to
 * docs/data/<zone>.json, plus a summary index at docs/data/zones.json.
 *
 * Re-run this any time (manually or via the scheduled GitHub Action) to
 * refresh the data - it's fully idempotent, each run overwrites the
 * previous output from scratch.
 */

const fs = require("fs");
const path = require("path");
const zones = require("./zones");

const JAKIM_BASE = "https://www.e-solat.gov.my/index.php";
const OUTPUT_DIR = path.join(__dirname, "..", "docs", "data");
const REQUEST_DELAY_MS = 300; // be polite to JAKIM's server
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchZonePrayerTimes(zoneCode) {
  const url = `${JAKIM_BASE}?r=esolatApi/takwimsolat&period=year&zone=${zoneCode}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "jadual-solat-malaysia/1.0 (github.com/mohdsyahid)" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.status !== "OK!") {
        throw new Error(`JAKIM API status: ${data.status}`);
      }
      return data.prayerTime;
    } catch (err) {
      console.warn(`  attempt ${attempt}/${MAX_RETRIES} failed for ${zoneCode}: ${err.message}`);
      if (attempt === MAX_RETRIES) throw err;
      await sleep(1000 * attempt);
    }
  }
}

/** Normalize JAKIM's DD-Mon-YYYY date string into ISO 8601 (YYYY-MM-DD). */
const MONTHS = {
  Jan: "01", Feb: "02", Mac: "03", Apr: "04", Mei: "05", Jun: "06",
  Jul: "07", Ogo: "08", Ogos: "08", Sep: "09", Okt: "10", Nov: "11", Dis: "12",
};

function toIsoDate(jakimDate) {
  const [day, monBm, year] = jakimDate.split("-");
  const month = MONTHS[monBm];
  if (!month) throw new Error(`Unrecognized month in date: ${jakimDate}`);
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function normalizeRecord(record) {
  return {
    date: toIsoDate(record.date),
    hijri: record.hijri,
    imsak: record.imsak.slice(0, 5),
    fajr: record.fajr.slice(0, 5),
    syuruk: record.syuruk.slice(0, 5),
    dhuha: record.dhuha.slice(0, 5),
    dhuhr: record.dhuhr.slice(0, 5),
    asr: record.asr.slice(0, 5),
    maghrib: record.maghrib.slice(0, 5),
    isha: record.isha.slice(0, 5),
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const zoneIndex = [];
  let failures = 0;

  for (const zone of zones) {
    process.stdout.write(`Fetching ${zone.code} (${zone.negeri})... `);
    try {
      const raw = await fetchZonePrayerTimes(zone.code);
      const records = raw.map(normalizeRecord);
      const payload = {
        zone: zone.code,
        negeri: zone.negeri,
        daerah: zone.daerah,
        generatedAt: new Date().toISOString(),
        source: "JAKIM e-solat (https://www.e-solat.gov.my)",
        year: records[0] ? records[0].date.slice(0, 4) : null,
        prayerTimes: records,
      };
      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${zone.code}.json`),
        JSON.stringify(payload, null, 2),
      );
      zoneIndex.push({ code: zone.code, negeri: zone.negeri, daerah: zone.daerah, count: records.length });
      console.log(`OK (${records.length} days)`);
    } catch (err) {
      failures += 1;
      console.log(`FAILED: ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "zones.json"),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), count: zoneIndex.length, zones: zoneIndex },
      null,
      2,
    ),
  );

  console.log(`\nDone. ${zoneIndex.length}/${zones.length} zones written, ${failures} failure(s).`);
  if (failures > 0 && zoneIndex.length === 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exitCode = 1;
  });
}

module.exports = { toIsoDate, normalizeRecord, MONTHS };
