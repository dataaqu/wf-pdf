import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function isValidDateString(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").slice(0, 200);
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const type = searchParams.get("type") || "";
  const pageRaw = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 10000) : 1;
  const limit = 10;

  // userId is hard-coded from session — never trusted from query params
  const where: Prisma.PdfHistoryWhereInput = {
    userId: session.user.id,
  };

  if (type === "a" || type === "b") {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { fileName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (dateFrom || dateTo) {
    const createdAtFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) {
      if (!isValidDateString(dateFrom)) {
        return NextResponse.json({ error: "Invalid dateFrom format" }, { status: 400 });
      }
      createdAtFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      if (!isValidDateString(dateTo)) {
        return NextResponse.json({ error: "Invalid dateTo format" }, { status: 400 });
      }
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      createdAtFilter.lt = end;
    }
    where.createdAt = createdAtFilter;
  }

  const [items, total] = await Promise.all([
    prisma.pdfHistory.findMany({
      where,
      select: {
        id: true,
        type: true,
        invoiceNumber: true,
        fileName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pdfHistory.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    pages: Math.ceil(total / limit) || 1,
    page,
  });
}
