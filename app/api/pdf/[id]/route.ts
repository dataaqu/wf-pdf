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
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!params.id || params.id.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const record = await prisma.pdfHistory.findUnique({
    where: { id: params.id },
  });

  // 404 (not 403) on cross-user access to avoid leaking ID existence
  if (!record || record.userId !== session.user.id) {
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

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(record.htmlContent, { waitUntil: "networkidle0", timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
      timeout: 30000,
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
