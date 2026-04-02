import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export async function generatePdf(
  type: string,
  data: Record<string, string>
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "templates", `type-${type}.html`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: type-${type}.html`);
  }

  let html = fs.readFileSync(templatePath, "utf-8");

  // Inject header image as base64 for type B
  if (type === "b") {
    const headerPath = path.join(process.cwd(), "public", "logos", "header.png");
    if (fs.existsSync(headerPath)) {
      const headerBase64 = fs.readFileSync(headerPath).toString("base64");
      html = html.replaceAll("{{headerBase64}}", headerBase64);
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
    // Inject partner logos 1-5
    for (let i = 1; i <= 5; i++) {
      const logoPath = path.join(process.cwd(), "public", "logos", `${i}.png`);
      if (fs.existsSync(logoPath)) {
        const logoBase64 = fs.readFileSync(logoPath).toString("base64");
        html = html.replaceAll(`{{logo${i}Base64}}`, logoBase64);
      }
    }
    const signPath = path.join(process.cwd(), "public", "logos", "sign.png");
    if (fs.existsSync(signPath)) {
      const signBase64 = fs.readFileSync(signPath).toString("base64");
      html = html.replaceAll("{{signBase64}}", signBase64);
    }
    // Prefix invoice number with WF-
    if (data.invoiceNo) {
      data.invoiceNo = `WF-${data.invoiceNo}`;
    }
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

    // Build table rows HTML
    const tableRows = items.map((item, i) => {
      const desc = esc(item.description);
      const rawAmt = parseFloat(item.amount) || 0;
      const isCreditNote = item.description === "Credit Note";
      const displayAmt = isCreditNote ? "-" + currencySymbol + fmt(rawAmt) : currencySymbol + fmt(rawAmt);
      const transport = esc(transportLines[i] || "");
      return `<tr><td>${desc}</td><td>${displayAmt}</td><td>${transport}</td></tr>`;
    }).join("");

    data.tableRows = tableRows;

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
    // tableRows is pre-escaped HTML, inject as-is
    if (key === "tableRows") {
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

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
