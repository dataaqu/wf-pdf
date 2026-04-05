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
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const userId = searchParams.get("userId") || "";
  const type = searchParams.get("type") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  const where: Prisma.PdfHistoryWhereInput = {};

  if (userId) {
    where.userId = userId;
  }

  if (type) {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { fileName: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
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
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pdfHistory.count({ where }),
  ]);

  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    users,
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      invoiceNumber: item.invoiceNumber,
      fileName: item.fileName,
      createdAt: item.createdAt,
      userName: item.user.name,
      username: item.user.username,
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}
