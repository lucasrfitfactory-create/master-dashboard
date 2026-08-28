// Central registry of every business shown on the master dashboard. Add a
// new business by adding an entry here (plus its spreadsheet env var) — no
// other code changes needed. A business with no spreadsheetIdEnv set (or
// missing goal/revenue cells) renders as a "not connected yet" card instead
// of erroring.

export type BusinessConfig = {
  id: string;
  name: string;
  shortName: string;
  // "image" -> logoSrc is a real logo file in /public/logos.
  // "wordmark" -> logoSrc is ignored; the name is rendered as styled text
  // until a real logo file is provided.
  logoKind: "image" | "wordmark";
  logoSrc: string;
  logoAlt: string;
  accent: string; // tailwind text color class for the wordmark placeholder
  spreadsheetIdEnv: string;
  goalCell: string | null; // e.g. "I3" — left cell of a merged goal range
  revenueCell: string | null; // e.g. "H47"
  tabOverrideEnv?: string; // optional: force a specific tab name instead of auto month resolution
};

export const BUSINESSES: BusinessConfig[] = [
  {
    id: "ff-downtown",
    name: "Fit Factory Downtown",
    shortName: "Downtown",
    logoKind: "image",
    logoSrc: "/logos/fit-factory.png",
    logoAlt: "Fit Factory",
    accent: "text-white",
    spreadsheetIdEnv: "GOOGLE_SHEETS_SPREADSHEET_ID_FITFACTORY",
    goalCell: "I3",
    revenueCell: "H47",
  },
  {
    id: "ff-midtown",
    name: "Fit Factory Midtown",
    shortName: "Midtown",
    logoKind: "image",
    logoSrc: "/logos/fit-factory.png",
    logoAlt: "Fit Factory",
    accent: "text-white",
    spreadsheetIdEnv: "GOOGLE_SHEETS_SPREADSHEET_ID_FITFACTORY",
    goalCell: "R3",
    revenueCell: "H83",
  },
  {
    id: "refined-reformer",
    name: "Refined Reformer",
    shortName: "Refined Reformer",
    logoKind: "image",
    logoSrc: "/logos/refined-reformer.png",
    logoAlt: "Refined Reformer",
    accent: "text-rose-300",
    spreadsheetIdEnv: "GOOGLE_SHEETS_SPREADSHEET_ID_REFINED_REFORMER",
    goalCell: "H3",
    revenueCell: "G47",
  },
  {
    id: "nrg-haus",
    name: "NRG Haus",
    shortName: "NRG Haus",
    logoKind: "image",
    logoSrc: "/logos/nrg-haus.png",
    logoAlt: "NRG Haus",
    accent: "text-sky-300",
    spreadsheetIdEnv: "GOOGLE_SHEETS_SPREADSHEET_ID_NRG_HAUS",
    // Cell mapping confirmed; spreadsheet ID still pending — set
    // GOOGLE_SHEETS_SPREADSHEET_ID_NRG_HAUS once the sheet is shared with
    // the service account.
    goalCell: "I3",
    revenueCell: "H46",
  },
];
