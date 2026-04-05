import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generatePdf, prepareHtml } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["a", "b"];
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const MAX_STRING_LENGTH = 500;

function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_STRING_LENGTH);
}

function sanitizeData(data: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof key !== "string" || key.length > 100) continue;
    // Allow serviceItems, servicePriceItems, and transportUnitNumbers to be longer (JSON arrays / multiline)
    if (key === "serviceItems" || key === "servicePriceItems" || key === "transportUnitNumbers") {
      sanitized[key] = typeof value === "string" ? value.trim().slice(0, 10000) : "";
    } else {
      sanitized[key] = sanitizeString(value);
    }
  }
  return sanitized;
}

function validateTypeA(data: Record<string, string>): string | null {
  const required = ["order", "orderDate", "transportMode"];
  for (const field of required) {
    if (!data[field]) return `Missing required field: ${field}`;
  }
  const validModes = ["road", "sea", "air", "rail"];
  if (!validModes.includes(data.transportMode.toLowerCase())) {
    return `Invalid transport mode. Must be one of: ${validModes.join(", ")}`;
  }
  return null;
}

function validateTypeB(data: Record<string, string>): string | null {
  const required = ["invoiceNo", "invoiceDate"];
  for (const field of required) {
    if (!data[field]) return `Missing required field: ${field}`;
  }
  if (data.currency && !["USD", "EUR", "GEL"].includes(data.currency)) {
    return "Invalid currency. Must be USD, EUR, or GEL";
  }
  if (data.bank && !["tbc", "bog", "halyk"].includes(data.bank)) {
    return "Invalid bank. Must be tbc, bog, or halyk";
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check content length
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
      return NextResponse.json(
        { error: "Missing or invalid data object" },
        { status: 400 }
      );
    }

    // Sanitize all string inputs
    const data = sanitizeData(body.data);

    // Type-specific validation
    const validationError = type === "a" ? validateTypeA(data) : validateTypeB(data);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Prepare HTML for storage (before generatePdf mutates data)
    const dataCopy = JSON.parse(JSON.stringify(data));
    const html = prepareHtml(type, dataCopy);

    // Generate PDF
    const pdfBuffer = await generatePdf(type, data);

    // Build file name and extract invoice/order number
    let invoiceNumber: string | null = null;
    let fileName = `${type}-output.pdf`;

    if (type === "b" && data.invoiceNo) {
      invoiceNumber = data.invoiceNo; // already has WF- prefix after prepareHtml
      fileName = `TRANSPORTATION-INVOICE-${data.invoiceNo}-${data.currency || "USD"}.pdf`;
    } else if (type === "a" && dataCopy.order) {
      invoiceNumber = `#${dataCopy.order}`;
      fileName = `BOOKING-ORDER-${dataCopy.order}.pdf`;
    }

    // Save to history
    await prisma.pdfHistory.create({
      data: {
        userId: session.user.id,
        type,
        invoiceNumber,
        fileName,
        htmlContent: html,
      },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}-output.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
