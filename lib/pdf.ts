import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export function prepareHtml(
  type: string,
  data: Record<string, string>
): string {
  const templatePath = path.join(process.cwd(), "templates", `type-${type}.html`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: type-${type}.html`);
  }

  let html = fs.readFileSync(templatePath, "utf-8");

  // Inject header/footer images as base64
  if (type === "a" || type === "b") {
    const headerPath = path.join(process.cwd(), "public", "logos", "header.png");
    if (fs.existsSync(headerPath)) {
      const headerBase64 = fs.readFileSync(headerPath).toString("base64");
      html = html.replaceAll("{{headerBase64}}", headerBase64);
    }
    const headerBookPath = path.join(process.cwd(), "public", "logos", "headerBook.png");
    if (fs.existsSync(headerBookPath)) {
      const headerBookBase64 = fs.readFileSync(headerBookPath).toString("base64");
      html = html.replaceAll("{{headerBookBase64}}", headerBookBase64);
    }
    const icons = ["road", "ship", "plane", "train", "check"];
    for (const icon of icons) {
      const iconPath = path.join(process.cwd(), "public", "logos", `${icon}.png`);
      if (fs.existsSync(iconPath)) {
        const iconBase64 = fs.readFileSync(iconPath).toString("base64");
        html = html.replaceAll(`{{${icon}Base64}}`, iconBase64);
      }
    }
    const footerPath = path.join(process.cwd(), "public", "logos", "footer.png");
    if (fs.existsSync(footerPath)) {
      const footerBase64 = fs.readFileSync(footerPath).toString("base64");
      html = html.replaceAll("{{footerBase64}}", footerBase64);
    }
    // Inject Montserrat font as base64
    const fontPath = path.join(process.cwd(), "public", "fonts", "Montserrat-Black11.woff2");
    if (fs.existsSync(fontPath)) {
      const fontBase64 = fs.readFileSync(fontPath).toString("base64");
      html = html.replaceAll("{{montserratBase64}}", fontBase64);
    }
    const signPath = path.join(process.cwd(), "public", "logos", "sign.png");
    if (fs.existsSync(signPath)) {
      const signBase64 = fs.readFileSync(signPath).toString("base64");
      html = html.replaceAll("{{signBase64}}", signBase64);
    }
    const datePath = path.join(process.cwd(), "public", "logos", "date.png");
    if (fs.existsSync(datePath)) {
      const dateBase64 = fs.readFileSync(datePath).toString("base64");
      html = html.replaceAll("{{dateBase64}}", dateBase64);
    }
    const arrowPath = path.join(process.cwd(), "public", "logos", "arrow.png");
    if (fs.existsSync(arrowPath)) {
      const arrowBase64 = fs.readFileSync(arrowPath).toString("base64");
      html = html.replaceAll("{{arrowBase64}}", arrowBase64);
    }
    const backPath = path.join(process.cwd(), "public", "logos", "back.png");
    if (fs.existsSync(backPath)) {
      const backBase64 = fs.readFileSync(backPath).toString("base64");
      html = html.replaceAll("{{backBase64}}", backBase64);
    }
  }

  if (type === "a") {
    // Transport mode active states
    const mode = (data.transportMode || "").toLowerCase();
    data.roadActive = mode === "road" ? "active" : "";
    data.seaActive = mode === "sea" ? "active" : "";
    data.airActive = mode === "air" ? "active" : "";
    data.railActive = mode === "rail" ? "active" : "";
    data.roadCheck = mode === "road" ? "visible" : "hidden";
    data.seaCheck = mode === "sea" ? "visible" : "hidden";
    data.airCheck = mode === "air" ? "visible" : "hidden";
    data.railCheck = mode === "rail" ? "visible" : "hidden";

    // Insurance badge class
    const insurance = (data.insuranceStatus || "").toLowerCase();
    data.insuranceBadgeClass = insurance === "ensured" ? "badge-green" : "badge-red";

    // Process service price items
    if (data.servicePriceItems) {
      let items: { description: string; amount: string; currency?: string }[] = [];
      try {
        items = JSON.parse(data.servicePriceItems);
      } catch {
        items = [];
      }
      const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      const servicePriceRows = items.map((item) => {
        const desc = esc(item.description);
        const amt = parseFloat(item.amount) || 0;
        const cur = item.currency || "USD";
        const symbol = cur === "GEL" ? "₾" : cur === "EUR" ? "€" : "$";
        return `<tr><td>${desc}</td><td>${symbol}${fmt(amt)}</td></tr>`;
      }).join("");

      data.servicePriceRows = servicePriceRows;
      data.servicePriceItems = "";
    }
  }

  if (type === "b") {
    // Auto-size company name
    const companyName = data.invoiceTo || "";
    if (companyName.length > 80) {
      data.invoiceToClass = "very-long-text";
    } else if (companyName.length > 40) {
      data.invoiceToClass = "long-text";
    } else {
      data.invoiceToClass = "";
    }

    // Prefix invoice number with WF-
    if (data.invoiceNo) {
      data.invoiceNo = `WF-${data.invoiceNo}`;
    }

    // Bank details based on bank + currency selection
    const bankDetails: Record<string, Record<string, { name: string; code: string; iban: string }>> = {
      tbc: {
        GEL: { name: "JSC TBC Bank", code: "TBCBGE22", iban: "GE29TB7006536070100002" },
        USD: { name: "JSC TBC Bank", code: "TBCBGE22", iban: "GE73TB7006536170100002" },
        EUR: { name: "JSC TBC Bank", code: "TBCBGE22", iban: "GE73TB7006536170100002" },
      },
      bog: {
        GEL: { name: "JSC Bank of Georgia", code: "BAGAGE22", iban: "GE42BG0000000549779564" },
        USD: { name: "JSC Bank of Georgia", code: "BAGAGE22", iban: "GE42BG0000000549779564" },
        EUR: { name: "JSC Bank of Georgia", code: "BAGAGE22", iban: "GE42BG0000000549779564" },
      },
      halyk: {
        GEL: { name: "JSC Halyk Bank Georgia", code: "HABGGE22XXX", iban: "GE73HB0000000016963602" },
        USD: { name: "JSC Halyk Bank Georgia", code: "HABGGE22XXX", iban: "GE90HB0000000033533612" },
        EUR: { name: "JSC Halyk Bank Georgia", code: "HABGGE22XXX", iban: "GE89HB0000000033553612" },
      },
    };
    const selectedBank = data.bank || "tbc";
    const selectedCurrency = data.bankCurrency || data.currency || "USD";
    const bank = bankDetails[selectedBank]?.[selectedCurrency] || bankDetails.tbc.USD;
    data.bankName = bank.name;
    data.bankCode = bank.code;
    data.bankIban = bank.iban;
  }

  // Process service items and compute totals for type B
  if (type === "b" && data.serviceItems) {
    let items: { description: string; amount: string }[] = [];
    try {
      items = JSON.parse(data.serviceItems);
    } catch {
      items = [];
    }
    const vatPercent = parseFloat(data.vatPercent || "0") || 0;
    const currencySymbol = data.currency === "GEL" ? "₾" : data.currency === "EUR" ? "€" : "$";
    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    // Build transport unit numbers array
    const transportLines = (data.transportUnitNumbers || "").split("\n").filter((l: string) => l.trim());

    // Group transport units per row: if more than item count, pair them with " / "
    const groupedTransport: string[] = [];
    if (transportLines.length > items.length) {
      const perRow = Math.ceil(transportLines.length / items.length);
      for (let i = 0; i < items.length; i++) {
        const chunk = transportLines.slice(i * perRow, (i + 1) * perRow);
        groupedTransport.push(chunk.join(" / "));
      }
    } else {
      for (let i = 0; i < items.length; i++) {
        groupedTransport.push(transportLines[i] || "");
      }
    }

    const transportCompact = transportLines.length > 10;

    // Build table rows HTML
    const tableRows = items.map((item, i) => {
      const desc = esc(item.description);
      const rawAmt = parseFloat(item.amount) || 0;
      const isCreditNote = item.description === "Credit Note";
      const displayAmt = isCreditNote ? "-" + currencySymbol + fmt(rawAmt) : currencySymbol + fmt(rawAmt);
      const transport = esc(groupedTransport[i] || "");
      const transportStyle = transportCompact ? ' style="font-size:10px"' : '';
      return `<tr><td${transportStyle}>${transport}</td><td>${desc}</td><td>${displayAmt}</td></tr>`;
    }).join("");

    data.tableRows = tableRows;
    data.tableClass = items.length > 6 ? "compact" : "";

    const totalAmount = items.reduce((sum, i) => {
      const amt = parseFloat(i.amount) || 0;
      return i.description === "Credit Note" ? sum - amt : sum + amt;
    }, 0);
    const vatAmt = totalAmount * vatPercent / 100;
    const totalPrice = totalAmount + vatAmt;

    data.subtotal = currencySymbol + fmt(totalAmount);
    data.vatDisplay = vatPercent + "%";
    data.vatAmount = currencySymbol + fmt(vatAmt);
    data.totalPrice = currencySymbol + fmt(totalPrice);
    // Clear processed fields so they don't get double-injected
    data.serviceItems = "";
    data.vatPercent = "";
    data.transportUnitNumbers = "";
  }

  // Inject data into template placeholders ({{key}})
  for (const [key, value] of Object.entries(data)) {
    // Pre-escaped HTML fields, inject as-is
    if (key === "tableRows" || key === "servicePriceRows") {
      html = html.replaceAll(`{{${key}}}`, value);
      continue;
    }
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    html = html.replaceAll(`{{${key}}}`, escaped);
  }

  // Remove any remaining unfilled placeholders
  html = html.replace(/\{\{[^}]+\}\}/g, "");

  return html;
}

export async function generatePdf(
  type: string,
  data: Record<string, string>
): Promise<Buffer> {
  const html = prepareHtml(type, data);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
      timeout: 30000,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
