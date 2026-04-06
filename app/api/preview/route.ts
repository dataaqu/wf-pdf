import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prepareHtml } from "@/lib/pdf";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = new URL(request.url).searchParams.get("type") || "b";

  // Sample data for preview
  const sampleData: Record<string, string> = type === "b" ? {
    invoiceNo: "1001",
    invoiceDate: "2026-04-06",
    invoiceDueDate: "2026-04-20",
    invoiceTo: "SAMPLE COMPANY LLC",
    invoiceToId: "123456789",
    routeFrom: "ISTANBUL",
    routeTo: "TBILISI",
    currency: "USD",
    bank: "tbc",
    serviceItems: JSON.stringify([
      { description: "Trucking", amount: "1500" },
      { description: "Custom Clearance", amount: "300" },
      { description: "THC", amount: "200" },
    ]),
    transportUnitNumbers: "CONT-123456\nCONT-789012\nCONT-345678",
    vatPercent: "0",
  } : {
    order: "3001",
    orderDate: "2026-04-06",
    transportMode: "road",
    shipper: "SAMPLE SHIPPER LLC",
    consignee: "SAMPLE CONSIGNEE LLC",
    from: "ISTANBUL",
    to: "TBILISI",
    insuranceStatus: "ensured",
    paymentTerms: "Full payment prior to unloading",
    servicePriceItems: JSON.stringify([
      { description: "Trucking", amount: "2500", currency: "USD" },
    ]),
  };

  const html = prepareHtml(type, sampleData);

  // Wrap with auto-center styling
  const centered = html.replace(
    "</style>",
    "body { margin: 0 auto !important; } .page { margin: 0 auto !important; }</style>"
  );

  return new NextResponse(centered, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
