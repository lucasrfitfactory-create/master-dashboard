# Deployment

## SEO / discoverability protection (already implemented)

- `robots` metadata (`noindex, nofollow, noarchive, nosnippet`) is set in `src/app/layout.tsx`.
- `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` header is added to every response in `next.config.js`.
- Do not link to the deployed URL from the public website or sitemap.

## Access control

This app has **no authentication built in**. Before sharing the URL beyond the people who should see cross-business revenue:

- **Preferred:** put the deployment behind Cloudflare Access (or Vercel's own Password Protection / SSO on paid plans), scoped to approved emails or the company Google Workspace domain.
- **Stopgap:** Vercel's built-in "Password Protection" (Pro plan) is the fastest option if this is going up before a proper access-control pass.

## Google Sheets access

- Set `DASHBOARD_DATA_SOURCE=google` and the `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_SHEETS_SPREADSHEET_ID_*` variables in the Vercel project's Environment Variables.
- Confirm the service account has Viewer access to every spreadsheet in play.
- Credentials are read server-side only (`src/lib/googleSheets/client.ts`), never bundled to the browser.
