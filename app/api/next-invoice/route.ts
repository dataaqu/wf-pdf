import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pdfType = new URL(request.url).searchParams.get("type") || "b";

  const latest = await prisma.pdfHistory.findFirst({
    where: { type: pdfType, invoiceNumber: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });

  let nextNumber = "3320";

  if (latest?.invoiceNumber) {
    const raw = pdfType === "b"
      ? latest.invoiceNumber.replace("WF-", "")
      : latest.invoiceNumber.replace("#", "");
    const base = raw.split("-")[0];
    const num = parseInt(base);
    if (!isNaN(num)) {
      nextNumber = String(num + 1);
    }
  }

  return NextResponse.json({ nextNumber });
}
