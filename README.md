# Fit Factory — Master Dashboard

A single-screen dashboard showing **Revenue MTD** for every Fit Factory Fitness business, stacked one below the other with each business's logo. Built on the same read-only, label-free spreadsheet approach as the [Downtown dashboard](https://github.com/lucasrfitfactory-create/fit-factory-dashboard), but pulling from four separate revenue sources instead of one.

## Businesses

| Business | Spreadsheet | Goal cell | Revenue MTD cell |
|---|---|---|---|
| Fit Factory Downtown | `GOOGLE_SHEETS_SPREADSHEET_ID_FITFACTORY` | `I3` | `H47` |
| Fit Factory Midtown | `GOOGLE_SHEETS_SPREADSHEET_ID_FITFACTORY` | `R3` | `H83` |
| Refined Reformer | `GOOGLE_SHEETS_SPREADSHEET_ID_REFINED_REFORMER` | `H3` | `G47` |
| NRG Haus | `GOOGLE_SHEETS_SPREADSHEET_ID_NRG_HAUS` | `I3` | `H46` |

This mapping lives in [`src/config/businesses.ts`](src/config/businesses.ts) — add a business or change a cell reference there, no other code changes needed. A business with no spreadsheet ID or cell mapping renders as a "not connected yet" card instead of erroring, so the dashboard stays usable while NRG Haus is being wired up.

Each business's monthly tab is auto-resolved from the current date (`JAN`…`DEC`, same convention as the source workbooks) via `src/lib/googleSheets/tabResolver.ts` — no hardcoded month name, so nothing needs redeploying at month rollover.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. By default `DASHBOARD_DATA_SOURCE=mock`, so it runs immediately with no Google credentials, using representative sample data (a **MOCK DATA** badge shows in the header whenever this mode is active).

## Switching to live Google Sheets data

1. In Google Cloud Console, create/select a project and enable the **Google Sheets API**.
2. Create a **Service Account** (IAM & Admin → Service Accounts) and generate a **JSON key**.
3. Share each spreadsheet above with the service account's email (`client_email` in the JSON key) as **Viewer**.
4. In `.env.local`, set `DASHBOARD_DATA_SOURCE=google`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and the `GOOGLE_SHEETS_SPREADSHEET_ID_*` variables.
5. Restart `npm run dev`.

One service account works for every business — you only need to create it once and share each new spreadsheet with the same email.

## NRG Haus

Cell mapping (`I3` goal, `H46` revenue MTD), spreadsheet ID, and logo are all configured. Only remaining step: share that spreadsheet with the service account email as **Viewer** — the card will switch from "Not connected" to live data automatically once `DASHBOARD_DATA_SOURCE=google` is set, no code changes needed.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) — this dashboard has no authentication built in yet; add access control before putting it behind a public URL.
