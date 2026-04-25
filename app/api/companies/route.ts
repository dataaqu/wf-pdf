import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Any authenticated user can list companies for form selection

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: unknown; taxId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const taxId = typeof body.taxId === "string" ? body.taxId.trim() : "";

  if (!name || !taxId) {
    return NextResponse.json({ error: "Name and Tax ID are required" }, { status: 400 });
  }

  const company = await prisma.company.create({
    data: { name: name.slice(0, 255), taxId: taxId.slice(0, 50) },
  });

  return NextResponse.json(company);
}
