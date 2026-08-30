# 🕌 Jadual Solat Malaysia

[![CI](https://github.com/mohdsyahid/jadual-solat-malaysia/actions/workflows/ci.yml/badge.svg)](https://github.com/mohdsyahid/jadual-solat-malaysia/actions/workflows/ci.yml)
[![Update prayer times](https://github.com/mohdsyahid/jadual-solat-malaysia/actions/workflows/update-data.yml/badge.svg)](https://github.com/mohdsyahid/jadual-solat-malaysia/actions/workflows/update-data.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Live page: https://mohdsyahid.github.io/jadual-solat-malaysia/**

Static JSON API + web page for Malaysia's official JAKIM prayer times, covering all **60 JAKIM zones** (every state and daerah, including East Malaysia). Data auto-refreshes daily via GitHub Actions — no server, no cost, no maintenance.

## Why

JAKIM's official e-solat API is the authoritative source, but it's per-request, sometimes slow, and returns one format for humans rather than clean data for apps. This project turns it into:

- **A static JSON API** — one file per zone, a year of prayer times each, served free by GitHub Pages. Your app just `fetch()`es a URL.
- **A simple web page** — pick your zone (or use the remembered default), see today's times with the next prayer highlighted.
- **Daily automation** — a scheduled action re-fetches all 60 zones every night at 02:30 MYT and commits fresh data.

## The JSON API

All data lives under `docs/data/`:

| URL | Content |
|---|---|
| `data/zones.json` | Index of all zones (code, negeri, daerah, record count) |
| `data/<ZONE>.json` | One year of prayer times for that zone |

Example — zone `SGR01` (Selangor: Gombak, Petaling, Shah Alam):

```
https://mohdsyahid.github.io/jadual-solat-malaysia/data/SGR01.json
```

Response shape:

```json
{
  "zone": "SGR01",
  "negeri": "Selangor",
  "daerah": "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam",
  "generatedAt": "2026-08-30T21:40:00.000Z",
  "source": "JAKIM e-solat (https://www.e-solat.gov.my)",
  "year": "2026",
  "prayerTimes": [
    {
      "date": "2026-08-30",
      "hijri": "1448-03-17",
      "imsak": "05:50",
      "fajr": "06:00",
      "syuruk": "07:08",
      "dhuha": "07:33",
      "dhuhr": "13:17",
      "asr": "16:26",
      "maghrib": "19:21",
      "isha": "20:31"
    }
  ]
}
```

Zone codes follow JAKIM's official scheme (`JHR01`–`JHR04`, `KDH01`–`KDH07`, ..., `WLY01`, `WLY02`) — see `src/zones.js` or `data/zones.json` for the full mapping to negeri/daerah.

## Running it yourself

Requires Node 18+ (uses built-in `fetch`, zero dependencies):

```bash
git clone https://github.com/mohdsyahid/jadual-solat-malaysia.git
cd jadual-solat-malaysia
npm run generate   # fetches all 60 zones, writes docs/data/*.json
npm test           # run the test suite (node:test)
```

## How the daily update works

[`update-data.yml`](.github/workflows/update-data.yml) runs at 02:30 MYT every night, fetches the full year for all 60 zones from e-solat.gov.my (with retries and polite rate-limiting), and commits any changes to `docs/data/`. Since JAKIM's year endpoint returns the whole year in one call per zone, one daily run keeps everything current — future dates, corrections and all.

## Project structure

```
jadual-solat-malaysia/
├── docs/                      # served by GitHub Pages
│   ├── index.html              # web page (zone picker + daily times)
│   └── data/*.json              # the static JSON API (generated)
├── src/
│   ├── zones.js                 # official JAKIM zone list (code ↔ negeri/daerah)
│   └── generate.js              # fetch + normalize script
├── tests/generate.test.js       # node:test suite
└── .github/workflows/
    ├── ci.yml                    # tests on every push/PR
    └── update-data.yml            # nightly regeneration
```

## Data source & disclaimer

All prayer time data is fetched from [JAKIM e-solat](https://www.e-solat.gov.my), the official Malaysian source. This project is not affiliated with JAKIM. Zone codes and daerah mappings are cross-checked against the community-maintained [waktusolat.app](https://api.waktusolat.app/zones) zone list. For official purposes, always refer to JAKIM or your state's religious authority directly.

## Contributing

Issues and PRs welcome — zone corrections, new output formats (CSV? iCal?), or a nicer UI. `npm test` should pass before submitting.

## License

[MIT](LICENSE)
