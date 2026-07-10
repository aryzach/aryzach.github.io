// Server-side PDF builder for signed rental agreements.
// Uses pdf-lib in Deno. Produces: [Rental Summary page(s)] + [Audit page] +
// [Master Agreement pages], returned as a single Uint8Array.

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "https://esm.sh/pdf-lib@1.17.1";

export interface RentalSummarySnapshot {
  reservation_id: string;
  agreement_version: string;
  customer_legal_name: string;
  phone: string | null;
  email: string;
  installation_address: string;
  sauna_type: string;
  placement: "indoor" | "outdoor";
  commitment_months: number;
  monthly_price: number;
  delivery_fee: number;
  security_deposit: number;
  insurance_selected: boolean;
  insurance_monthly_price: number;
  second_heater_selected: boolean;
  second_heater_monthly_price: number;
  stair_elevator_charge: number | null;
  preferred_installation_date: string;
  installation_city?: string;
  installation_street?: string;
}

export interface AuditInfo {
  typed_legal_name: string;
  signed_at: string; // ISO
  time_zone: string | null;
  ip_address: string | null;
  user_agent: string | null;
  agreement_version: string;
  reservation_id: string;
  contract_id: string;
  acknowledgments: { key: string; text: string; accepted_at: string }[];
  electronic_consent_confirmed: boolean;
}

const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const MARGIN_X = 54;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;

function fmtUSD(dollars: number): string {
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function commitmentLabel(m: number): string {
  return m === 1 ? "1 month" : `${m} months`;
}

// Wrap text on word boundaries to fit within a max width.
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? current + " " + w : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface Cursor {
  page: PDFPage;
  y: number;
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
}

function ensureRoom(c: Cursor, need: number) {
  if (c.y - need < MARGIN_BOTTOM) {
    c.page = c.doc.addPage([PAGE_W, PAGE_H]);
    c.y = PAGE_H - MARGIN_TOP;
  }
}

function drawParagraph(c: Cursor, text: string, size = 10, gap = 2) {
  const lines = wrap(text, c.font, size, PAGE_W - MARGIN_X * 2);
  for (const line of lines) {
    ensureRoom(c, size + gap);
    c.page.drawText(line, {
      x: MARGIN_X, y: c.y - size, size, font: c.font, color: rgb(0.1, 0.1, 0.1),
    });
    c.y -= size + gap;
  }
}

function drawHeading(c: Cursor, text: string, size = 12) {
  c.y -= 6;
  ensureRoom(c, size + 8);
  c.page.drawText(text.toUpperCase(), {
    x: MARGIN_X, y: c.y - size, size, font: c.bold, color: rgb(0.35, 0.4, 0.48),
    // letter spacing not supported; kept short
  });
  c.y -= size + 4;
  ensureRoom(c, 6);
  c.page.drawLine({
    start: { x: MARGIN_X, y: c.y },
    end: { x: PAGE_W - MARGIN_X, y: c.y },
    thickness: 0.5,
    color: rgb(0.85, 0.87, 0.9),
  });
  c.y -= 8;
}

function drawKV(c: Cursor, label: string, value: string, size = 10) {
  const rowHeight = size + 6;
  ensureRoom(c, rowHeight * 2);
  c.page.drawText(label, {
    x: MARGIN_X, y: c.y - size, size: size - 1, font: c.font, color: rgb(0.42, 0.46, 0.53),
  });
  c.y -= size + 1;
  const lines = wrap(value, c.bold, size, PAGE_W - MARGIN_X * 2);
  for (const line of lines) {
    ensureRoom(c, size + 2);
    c.page.drawText(line, {
      x: MARGIN_X, y: c.y - size, size, font: c.bold, color: rgb(0.09, 0.12, 0.18),
    });
    c.y -= size + 2;
  }
  c.y -= 4;
}

function drawPriceRow(c: Cursor, label: string, value: string, emphasize = false) {
  const size = 10;
  ensureRoom(c, size + 8);
  c.page.drawText(label, {
    x: MARGIN_X + 4, y: c.y - size, size, font: c.font, color: rgb(0.32, 0.36, 0.43),
  });
  const vFont = emphasize ? c.bold : c.font;
  const vWidth = vFont.widthOfTextAtSize(value, size);
  c.page.drawText(value, {
    x: PAGE_W - MARGIN_X - 4 - vWidth, y: c.y - size, size, font: vFont, color: rgb(0.09, 0.12, 0.18),
  });
  c.y -= size + 4;
  c.page.drawLine({
    start: { x: MARGIN_X, y: c.y },
    end: { x: PAGE_W - MARGIN_X, y: c.y },
    thickness: 0.3,
    color: rgb(0.9, 0.92, 0.94),
  });
  c.y -= 6;
}

async function buildRentalSummary(
  doc: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  s: RentalSummarySnapshot,
): Promise<void> {
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const c: Cursor = { doc, page, y: PAGE_H - MARGIN_TOP, font, bold };

  // Header
  c.page.drawText("SF SAUNA RENTAL", {
    x: MARGIN_X, y: c.y - 9, size: 9, font: bold, color: rgb(0.45, 0.5, 0.57),
  });
  c.y -= 14;
  c.page.drawText("Rental Summary", {
    x: MARGIN_X, y: c.y - 22, size: 22, font: bold, color: rgb(0.06, 0.09, 0.14),
  });
  c.y -= 30;
  const meta = `Reservation ID: ${s.reservation_id.slice(0, 8)}    Master Agreement: ${s.agreement_version}`;
  c.page.drawText(meta, {
    x: MARGIN_X, y: c.y - 9, size: 9, font, color: rgb(0.4, 0.45, 0.53),
  });
  c.y -= 20;

  drawHeading(c, "Customer");
  drawKV(c, "Legal name", s.customer_legal_name);
  drawKV(c, "Email", s.email);
  if (s.phone) drawKV(c, "Phone", s.phone);
  drawKV(c, "Installation address", s.installation_address);

  drawHeading(c, "Sauna & installation");
  drawKV(c, "Sauna type", s.sauna_type);
  drawKV(c, "Placement", s.placement === "indoor" ? "Indoor" : "Outdoor");
  drawKV(c, "Initial commitment", commitmentLabel(s.commitment_months));
  drawKV(c, "Preferred installation date", fmtDate(s.preferred_installation_date));

  drawHeading(c, "Pricing");
  drawPriceRow(c, "Monthly rental", `${fmtUSD(s.monthly_price)} / month`, true);
  drawPriceRow(c, "Delivery fee", fmtUSD(s.delivery_fee));
  drawPriceRow(c, "Security deposit (refundable)", fmtUSD(s.security_deposit));
  drawPriceRow(
    c,
    "Optional insurance",
    s.insurance_selected ? `${fmtUSD(s.insurance_monthly_price)} / month` : "Not selected",
  );
  drawPriceRow(
    c,
    "Optional second heater",
    s.second_heater_selected ? `${fmtUSD(s.second_heater_monthly_price)} / month` : "Not selected",
  );
  drawPriceRow(
    c,
    "Stair / elevator charge",
    s.stair_elevator_charge == null ? "To be confirmed before delivery" : fmtUSD(s.stair_elevator_charge),
  );

  c.y -= 10;
  drawParagraph(
    c,
    "This Rental Summary and the incorporated Master Agreement together constitute the Rental Agreement. If a conflict exists regarding a customer-specific commercial term, this Rental Summary controls for that term.",
    9, 3,
  );
  c.y -= 4;
  drawParagraph(
    c,
    "Unless otherwise agreed in writing, the first and last month's rental fees, security deposit, and all applicable delivery, stair/elevator, site-preparation, equipment, and other charges are due upon delivery.",
    9, 3,
  );
}

async function buildAuditPage(
  doc: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  a: AuditInfo,
): Promise<void> {
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const c: Cursor = { doc, page, y: PAGE_H - MARGIN_TOP, font, bold };

  c.page.drawText("SIGNATURE & AUDIT RECORD", {
    x: MARGIN_X, y: c.y - 9, size: 9, font: bold, color: rgb(0.45, 0.5, 0.57),
  });
  c.y -= 14;
  c.page.drawText("Electronic Signature", {
    x: MARGIN_X, y: c.y - 20, size: 20, font: bold, color: rgb(0.06, 0.09, 0.14),
  });
  c.y -= 30;

  drawParagraph(
    c,
    "The customer named below has electronically signed this Rental Agreement by typing their legal name and confirming the acknowledgments listed on this page. This record was created and stored by SF Sauna at the moment of signing.",
    10, 3,
  );
  c.y -= 6;

  drawHeading(c, "Signed by");
  drawKV(c, "Typed legal name (electronic signature)", a.typed_legal_name);
  drawKV(c, "Signed at", new Date(a.signed_at).toUTCString());
  drawKV(c, "Signer time zone", a.time_zone || "Not provided");
  drawKV(c, "IP address", a.ip_address || "Not recorded");
  drawKV(c, "User agent", a.user_agent || "Not recorded");

  drawHeading(c, "Agreement identifiers");
  drawKV(c, "Reservation ID", a.reservation_id);
  drawKV(c, "Contract ID", a.contract_id);
  drawKV(c, "Master Agreement version", a.agreement_version);

  drawHeading(c, "Acknowledgments accepted");
  for (const ack of a.acknowledgments) {
    ensureRoom(c, 24);
    c.page.drawText("[x]", {
      x: MARGIN_X, y: c.y - 10, size: 10, font: bold, color: rgb(0.13, 0.55, 0.13),
    });
    const lines = wrap(ack.text, font, 10, PAGE_W - MARGIN_X * 2 - 22);
    let first = true;
    for (const line of lines) {
      ensureRoom(c, 12);
      c.page.drawText(line, {
        x: MARGIN_X + (first ? 22 : 22),
        y: c.y - 10, size: 10, font, color: rgb(0.13, 0.16, 0.22),
      });
      c.y -= 12;
      first = false;
    }
    c.page.drawText(`Accepted: ${new Date(ack.accepted_at).toUTCString()}`, {
      x: MARGIN_X + 22, y: c.y - 9, size: 8, font, color: rgb(0.5, 0.55, 0.63),
    });
    c.y -= 14;
  }

  if (a.electronic_consent_confirmed) {
    c.y -= 4;
    drawParagraph(
      c,
      "The signer expressly consented to receive, sign, and retain this Agreement electronically, and intended their typed legal name to serve as their electronic signature under the ESIGN Act and applicable state e-signature laws.",
      9, 3,
    );
  }
}

export async function buildSignedContractPdf(params: {
  summary: RentalSummarySnapshot;
  audit: AuditInfo;
  masterAgreementPdfBytes: Uint8Array;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  await buildRentalSummary(doc, font, bold, params.summary);
  await buildAuditPage(doc, font, bold, params.audit);

  // Merge master agreement pages
  try {
    const master = await PDFDocument.load(params.masterAgreementPdfBytes);
    const pages = await doc.copyPages(master, master.getPageIndices());
    for (const p of pages) doc.addPage(p);
  } catch (e) {
    // If the master agreement PDF is unreadable, still return summary + audit.
    console.error("Could not merge master agreement PDF:", e);
  }

  doc.setTitle(`SF Sauna Rental Agreement — ${params.summary.customer_legal_name}`);
  doc.setAuthor("SF Sauna Rental");
  doc.setSubject(`Signed rental agreement (${params.summary.agreement_version})`);
  doc.setCreationDate(new Date());

  return await doc.save();
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}