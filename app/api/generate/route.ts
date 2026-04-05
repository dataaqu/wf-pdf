import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generatePdf, prepareHtml } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["a", "b"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid data object" },
        { status: 400 }
      );
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
