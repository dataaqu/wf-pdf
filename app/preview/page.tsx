"use client";

import { useState } from "react";
import Link from "next/link";

export default function PreviewPage() {
  const [type, setType] = useState<"a" | "b">("b");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          &larr; Back
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Template:</span>
          <button
            onClick={() => setType("a")}
            className={`px-3 py-1 text-sm rounded ${type === "a" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400"}`}
          >
            Booking Order
          </button>
          <button
            onClick={() => setType("b")}
            className={`px-3 py-1 text-sm rounded ${type === "b" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400"}`}
          >
            Invoice
          </button>
        </div>
        <span className="text-xs text-yellow-500">TEMP PREVIEW</span>
      </div>

      {/* Preview iframe */}
      <div className="flex justify-center py-6 bg-gray-800" style={{ minHeight: "calc(100vh - 52px)" }}>
        <iframe
          key={type}
          src={`/api/preview?type=${type}`}
          className="bg-white shadow-2xl"
          style={{ width: "210mm", height: "297mm", border: "none" }}
        />
      </div>
    </div>
  );
}
