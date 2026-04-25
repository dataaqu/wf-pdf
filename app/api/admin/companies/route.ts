import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageRaw = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 10000) : 1;
  const limit = 20;

  const [items, total] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.company.count(),
  ]);

  return NextResponse.json({
    items,
    total,
    pages: Math.ceil(total / limit) || 1,
    page,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, taxId } = await req.json();

  if (!name?.trim() || !taxId?.trim()) {
    return NextResponse.json({ error: "Name and Tax ID are required" }, { status: 400 });
  }

  const trimmedName = name.trim().slice(0, 255);
  const trimmedTaxId = taxId.trim().slice(0, 50);

  const company = await prisma.company.create({
    data: { name: trimmedName, taxId: trimmedTaxId },
  });

  return NextResponse.json(company);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await prisma.company.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
