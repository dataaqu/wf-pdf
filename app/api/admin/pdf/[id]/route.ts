import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = await prisma.pdfHistory.findUnique({
    where: { id: params.id },
  });

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const mode = new URL(request.url).searchParams.get("mode");

  if (mode === "html") {
    const centered = record.htmlContent.replace(
      "</style>",
      "body { margin: 0 auto !important; } .page { margin: 0 auto !important; }</style>"
    );
    return new NextResponse(centered, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Generate PDF from stored HTML
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(record.htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${record.fileName}"`,
      },
    });
  } finally {
    await browser.close();
  }
}
