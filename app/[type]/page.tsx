"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";

const VALID_TYPES = ["a", "b"];

const SERVICE_OPTIONS = [
  "Airfreight",
  "Air Freight",
  "THC",
  "AWB",
  "Marking Fee",
  "Manipulation Fee",
  "Storage Fee",
  "Trucking",
  "CMR",
  "RWB",
  "HBL",
  "Domestic Transportation",
  "Custom Clearance",
  "Re-Loading",
  "Detention Fee",
  "Demurrage Fee",
  "Credit Note",
  "Declaration Fee",
  "Export Declaration",
  "EUR1",
  "T1",
  "T2",
  "Insurance",
];

interface ServiceItem {
  description: string;
  amount: string;
}

const TYPE_CONFIG = {
  a: {
    label: "Booking Order",
    color: "blue",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "field1", label: "Field 1", type: "text", required: true },
      { name: "field2", label: "Field 2", type: "text", required: false },
    ],
  },
  b: {
    label: "Invoice",
    color: "emerald",
    fields: [
      { name: "invoiceNo", label: "Invoice No", type: "text", required: true, placeholder: "3274" },
      { name: "invoiceDate", label: "Invoice Date", type: "date", required: true },
      { name: "invoiceDueDate", label: "Invoice Due Date", type: "date", required: true },
      { name: "invoiceTo", label: "Invoice To", type: "text", required: true, placeholder: "Company Name" },
      { name: "invoiceToId", label: "VAT#", type: "text", required: true, placeholder: "123456789" },
      { name: "currency", label: "Currency", type: "currency", required: true },
      { name: "_services", label: "", type: "custom", required: false },
      { name: "_transportUnits", label: "", type: "custom", required: false },
      { name: "direction", label: "Direction", type: "text", required: true, placeholder: "ITALY-PAVDORA. TBILISI-GEORGIA" },
    ],
  },
} as Record<string, { label: string; color: string; fields: { name: string; label: string; type: string; required: boolean; placeholder?: string }[] }>;

export default function TypeForm() {
  const params = useParams();
  const type = params.type as string;

  if (!VALID_TYPES.includes(type)) {
    notFound();
  }

  const config = TYPE_CONFIG[type];
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const now = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const today = now.toISOString().split("T")[0];
    return { invoiceDate: today, currency: "USD" };
  });
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([{ description: "", amount: "" }]);
  const [transportUnits, setTransportUnits] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = { ...formData };
      if (type === "b") {
        const validItems = serviceItems.filter(item => item.description && item.amount);
        submitData.serviceItems = JSON.stringify(validItems);
        const validUnits = transportUnits.filter(u => u.trim());
        submitData.transportUnitNumbers = validUnits.join("\n");
        submitData.vatPercent = submitData.currency === "GEL" ? "18" : "0";
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data: submitData }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to generate PDF");
      }

      const blob = await res.blob();
      setPdfBlob(blob);

      // Revoke previous URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = type === "b" && formData.invoiceNo
      ? `Invoice-WF-${formData.invoiceNo}-${formData.currency || "USD"}.pdf`
      : `${type}-output.pdf`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [pdfBlob, type, formData.invoiceNo, formData.currency]);

  return (
    <main className="relative min-h-screen p-8 overflow-x-hidden" style={{ backgroundColor: "#1f2023" }}>
      <img src="/logos/back.png" alt="" className="absolute right-0 bottom-0 pointer-events-none" style={{ maxHeight: "78vh", width: "auto", overflow: "hidden" }} />
      <div className="max-w-7xl mx-auto relative z-10">
        <Link
          href="/"
          className="text-sm mb-6 inline-block transition-colors"
          style={{ fontFamily: "var(--font-dachi)", color: "#307654" }}
        >
          &larr; უკან
        </Link>

        <div className="flex gap-8 items-start">
          {/* Left side — Form */}
          <div className="w-full max-w-md flex-shrink-0">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-dachi)" }}>
              {config.label} PDF
            </h1>
            <p className="mb-8" style={{ fontFamily: "var(--font-dachi)", color: "#307654" }}>
              შეავსე ველები და დააგენერირე <span style={{ color: "#fff" }}>PDF</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {config.fields.map((field) => (
                field.name === "_transportUnits" && type === "b" ? (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-white/70 mb-2" style={{ fontFamily: "var(--font-dachi)" }}>
                      Transport Unit Numbers
                    </label>
                    <div className="space-y-3">
                      {transportUnits.map((unit, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={unit}
                            onChange={(e) => {
                              const updated = [...transportUnits];
                              updated[index] = e.target.value.toUpperCase();
                              setTransportUnits(updated);
                            }}
                            className="flex-1 px-4 py-2.5 rounded-lg outline-none transition-all text-white placeholder-white/30 border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20 uppercase"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                            placeholder="Unit number"
                          />
                          {transportUnits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setTransportUnits(transportUnits.filter((_, i) => i !== index))}
                              className="text-red-400/60 hover:text-red-400 transition-colors p-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {transportUnits.length < 7 && (
                      <button
                        type="button"
                        onClick={() => setTransportUnits([...transportUnits, ""])}
                        className="mt-2 text-sm text-emerald-400/70 hover:text-emerald-400 transition-colors flex items-center gap-1"
                        style={{ fontFamily: "var(--font-dachi)" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        დამატება
                      </button>
                    )}
                  </div>
                ) :
                field.name === "_services" && type === "b" ? (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-white/70 mb-2" style={{ fontFamily: "var(--font-dachi)" }}>
                      Services <span className="text-emerald-400 ml-1">*</span>
                    </label>
                    <div className="space-y-3">
                      {serviceItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <select
                            required
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...serviceItems];
                              updated[index].description = e.target.value;
                              setServiceItems(updated);
                            }}
                            className="flex-1 px-4 py-2.5 rounded-lg outline-none transition-all text-white border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20 appearance-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                          >
                            <option value="" disabled>Select service</option>
                            {SERVICE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} style={{ backgroundColor: "#1f2023" }}>{opt}</option>
                            ))}
                          </select>
                          <div
                            className="flex items-center w-36 rounded-lg border border-white/10 focus-within:border-emerald-400/40 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                          >
                            <span className="pl-3 text-white/70 font-medium select-none">{formData.currency === "GEL" ? "₾" : formData.currency === "EUR" ? "€" : "$"}</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              required
                              value={item.amount}
                              onChange={(e) => {
                                const updated = [...serviceItems];
                                updated[index].amount = e.target.value;
                                setServiceItems(updated);
                              }}
                              className="flex-1 px-2 py-2.5 rounded-r-lg outline-none text-white placeholder-white/30 bg-transparent w-full"
                              placeholder="0.00"
                            />
                          </div>
                          {serviceItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setServiceItems(serviceItems.filter((_, i) => i !== index))}
                              className="text-red-400/60 hover:text-red-400 transition-colors p-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {serviceItems.length < 8 && (
                      <button
                        type="button"
                        onClick={() => setServiceItems([...serviceItems, { description: "", amount: "" }])}
                        className="mt-2 text-sm text-emerald-400/70 hover:text-emerald-400 transition-colors flex items-center gap-1"
                        style={{ fontFamily: "var(--font-dachi)" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        დამატება
                      </button>
                    )}
                  </div>
                ) :
                <div key={field.name}>
                  <label className="block text-sm font-medium text-white/70 mb-1" style={{ fontFamily: "var(--font-dachi)" }}>
                    {field.label}
                    {field.required && (
                      <span className="text-emerald-400 ml-1">*</span>
                    )}
                  </label>
                  {field.name === "invoiceNo" ? (
                    <div
                      className="flex items-center w-full rounded-lg border border-white/10 focus-within:border-emerald-400/40 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                    >
                      <span className="pl-4 text-white/70 font-medium select-none">WF-</span>
                      <input
                        type="text"
                        required={field.required}
                        placeholder="2424-1"
                        value={formData[field.name] || ""}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9-]/g, "");
                          handleChange(field.name, cleaned);
                        }}
                        className="flex-1 px-1 py-2.5 rounded-r-lg outline-none text-white placeholder-white/30 bg-transparent"
                      />
                    </div>
                  ) : field.type === "currency" ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {["USD", "EUR", "GEL"].map((cur) => (
                          <button
                            key={cur}
                            type="button"
                            onClick={() => handleChange("currency", cur)}
                            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                              formData.currency === cur
                                ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                                : "border-white/10 text-white/50 hover:border-white/30"
                            }`}
                            style={formData.currency !== cur ? { backgroundColor: "rgba(255,255,255,0.06)" } : {}}
                          >
                            {cur === "USD" ? "$ USD" : cur === "EUR" ? "€ EUR" : "₾ GEL"}
                          </button>
                        ))}
                      </div>
                      <div
                        className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                      >
                        <span>VAT</span>
                        <span className="font-medium text-white/70">{formData.currency === "GEL" ? "18%" : "0%"}</span>
                      </div>
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      required={field.required}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg outline-none transition-all text-white placeholder-white/30 border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20 resize-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg outline-none transition-all text-white placeholder-white/30 border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                style={{ fontFamily: "var(--font-dachi)", backgroundColor: "#307654" }}
              >
                {loading ? "გენერაცია..." : "PDF გენერაცია"}
              </button>
            </form>
          </div>

          {/* Right side — Preview */}
          <div className="flex-1 min-w-0">
            <div className="sticky top-8">
              <h2 className="text-sm font-medium text-white/50 mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-dachi)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
               
              </h2>

              {previewUrl ? (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-white/10 overflow-hidden backdrop-blur-md"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <iframe
                      src={previewUrl}
                      className="w-full border-0"
                      style={{ height: "70vh" }}
                      title="PDF Preview"
                    />
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full py-3 px-6 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    style={{ fontFamily: "var(--font-dachi)", backgroundColor: "#307654" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    გადმოწერა
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 border-dashed flex items-center justify-center text-white/30 text-sm backdrop-blur-md"
                  style={{ height: "70vh", background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto mb-3 text-white/20"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <p style={{ fontFamily: "var(--font-dachi)" }}>PDF პრევიუ აქ გამოჩნდება</p>
                    <p className="text-xs mt-1 text-white/20" style={{ fontFamily: "var(--font-dachi)" }}>
                      შეავსე ფორმა და დააჭირე გენერაციას
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
