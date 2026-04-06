"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HistoryItem {
  id: string;
  type: string;
  invoiceNumber: string | null;
  fileName: string;
  createdAt: string;
  userName: string;
  username: string;
}

interface UserInfo {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "USER";
}

interface HistoryResponse {
  items: HistoryItem[];
  users: UserInfo[];
  total: number;
  pages: number;
  page: number;
}

interface Company {
  id: string;
  name: string;
  taxId: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "companies">("history");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyTaxId, setNewCompanyTaxId] = useState("");
  const [companyLoading, setCompanyLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    const res = await fetch("/api/admin/companies");
    if (res.ok) {
      const json = await res.json();
      setCompanies(json);
    }
  }, []);

  const addCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyTaxId.trim()) return;
    setCompanyLoading(true);
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCompanyName.trim(), taxId: newCompanyTaxId.trim() }),
    });
    if (res.ok) {
      setNewCompanyName("");
      setNewCompanyTaxId("");
      fetchCompanies();
    }
    setCompanyLoading(false);
  };

  const deleteCompany = async (id: string) => {
    const res = await fetch("/api/admin/companies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchCompanies();
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (selectedUser) params.set("userId", selectedUser);
    if (selectedType) params.set("type", selectedType);
    params.set("page", String(page));

    const res = await fetch(`/api/admin/history?${params}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
      if (json.users && users.length === 0) setUsers(json.users);
    }
    setLoading(false);
  }, [search, dateFrom, dateTo, selectedUser, selectedType, page]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchHistory();
      fetchCompanies();
    }
  }, [status, session, fetchHistory, fetchCompanies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ka-GE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading") return null;
  if (session?.user?.role !== "ADMIN") return null;

  return (
    <main className="relative min-h-screen p-4 sm:p-8" style={{ backgroundColor: "#1f2023" }}>
      <img
        src="/logos/back.png"
        alt=""
        className="absolute right-0 bottom-0 pointer-events-none hidden sm:block"
        style={{ maxHeight: "78vh", width: "auto" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="text-sm mb-2 inline-block transition-colors"
              style={{ fontFamily: "var(--font-dachi)", color: "#307654" }}
            >
              &larr; უკან
            </Link>
            <h1
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "var(--font-dachi)" }}
            >
              ადმინ პანელი
            </h1>
            <p style={{ fontFamily: "var(--font-dachi)", color: "#307654" }}>
              დაგენერირებული <span style={{ color: "#fff" }}>PDF</span> ისტორია
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6" style={{ fontFamily: "var(--font-dachi)" }}>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "history"
                ? "border border-emerald-400 bg-emerald-400/20 text-emerald-400"
                : "border border-white/10 text-white/50 hover:border-white/30"
            }`}
            style={activeTab !== "history" ? { backgroundColor: "rgba(255,255,255,0.06)" } : {}}
          >
            ისტორია
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "companies"
                ? "border border-emerald-400 bg-emerald-400/20 text-emerald-400"
                : "border border-white/10 text-white/50 hover:border-white/30"
            }`}
            style={activeTab !== "companies" ? { backgroundColor: "rgba(255,255,255,0.06)" } : {}}
          >
            კომპანიები
          </button>
        </div>

        {activeTab === "companies" ? (
          <div>
            {/* Add company form */}
            <form onSubmit={addCompany} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="კომპანიის სახელი"
                className="flex-1 px-4 py-2.5 rounded-lg outline-none transition-all text-white placeholder-white/30 border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-dachi)" }}
                required
              />
              <input
                type="text"
                value={newCompanyTaxId}
                onChange={(e) => setNewCompanyTaxId(e.target.value)}
                placeholder="Tax ID"
                className="sm:w-48 px-4 py-2.5 rounded-lg outline-none transition-all text-white placeholder-white/30 border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-dachi)" }}
                required
              />
              <button
                type="submit"
                disabled={companyLoading}
                className="px-6 py-2.5 text-white font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                style={{ fontFamily: "var(--font-dachi)", backgroundColor: "#307654" }}
              >
                {companyLoading ? "..." : "დამატება"}
              </button>
            </form>

            {/* Companies list */}
            {companies.length > 0 ? (
              <div
                className="rounded-xl border border-white/10 overflow-hidden backdrop-blur-md"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-white/50 font-medium" style={{ fontFamily: "var(--font-dachi)" }}>სახელი</th>
                        <th className="px-4 py-3 text-white/50 font-medium" style={{ fontFamily: "var(--font-dachi)" }}>Tax ID</th>
                        <th className="px-4 py-3 text-white/50 font-medium" style={{ fontFamily: "var(--font-dachi)" }}>მოქმედება</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((company) => (
                        <tr key={company.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white/70">{company.name}</td>
                          <td className="px-4 py-3 text-white/70 font-mono text-xs">{company.taxId}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deleteCompany(company.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-red-400/30 text-red-400/70 hover:border-red-400 hover:text-red-400"
                              style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-dachi)" }}
                            >
                              წაშლა
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div
                className="text-center py-20 text-white/30"
                style={{ fontFamily: "var(--font-dachi)" }}
              >
                კომპანიები არ არის დამატებული
              </div>
            )}
          </div>
        ) : (
        <>
        {/* Type filter */}
        <div className="flex gap-2 mb-4" style={{ fontFamily: "var(--font-dachi)" }}>
          {[
            { value: "", label: "ყველა" },
            { value: "b", label: "Invoice" },
            { value: "a", label: "Booking Order" },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => { setSelectedType(t.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedType === t.value
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                  : "border border-white/10 text-white/50 hover:border-white/30"
              }`}
              style={selectedType !== t.value ? { backgroundColor: "rgba(255,255,255,0.06)" } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ძებნა (ინვოისი, სახელი)..."
            className="flex-1 px-4 py-2.5 rounded-lg outline-none transition-all text-white placeholder-white/30 border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-dachi)" }}
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2.5 rounded-lg outline-none text-white border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2.5 rounded-lg outline-none text-white border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 text-white font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            style={{ fontFamily: "var(--font-dachi)", backgroundColor: "#307654" }}
          >
            ძებნა
          </button>
        </form>

        {/* User filter */}
        {users.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6" style={{ fontFamily: "var(--font-dachi)" }}>
            <button
              onClick={() => { setSelectedUser(""); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedUser === ""
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                  : "border border-white/10 text-white/50 hover:border-white/30"
              }`}
              style={selectedUser !== "" ? { backgroundColor: "rgba(255,255,255,0.06)" } : {}}
            >
              ყველა
            </button>
            {users.filter(u => u.role === "ADMIN").map((u) => (
              <button
                key={u.id}
                onClick={() => { setSelectedUser(u.id); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedUser === u.id
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                    : "border border-white/10 text-white/50 hover:border-white/30"
                }`}
                style={selectedUser !== u.id ? { backgroundColor: "rgba(255,255,255,0.06)" } : {}}
              >
                {u.name} <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="inline ml-1 text-emerald-400/60"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
            ))}
            {users.filter(u => u.role === "USER").map((u) => (
              <button
                key={u.id}
                onClick={() => { setSelectedUser(u.id); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedUser === u.id
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                    : "border border-white/10 text-white/50 hover:border-white/30"
                }`}
                style={selectedUser !== u.id ? { backgroundColor: "rgba(255,255,255,0.06)" } : {}}
              >
                {u.name}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-white/50 text-center py-20" style={{ fontFamily: "var(--font-dachi)" }}>
            იტვირთება...
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="text-white/40 text-sm mb-3" style={{ fontFamily: "var(--font-dachi)" }}>
              სულ: {data.total} ჩანაწერი
            </div>

            {/* Table */}
            <div
              className="rounded-xl border border-white/10 overflow-hidden backdrop-blur-md"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-white/50 font-medium" style={{ fontFamily: "var(--font-dachi)" }}>ტიპი</th>
                      <th className="px-4 py-3 text-white/50 font-medium" style={{ fontFamily: "var(--font-dachi)" }}>ინვოისი #</th>
                      <th className="px-4 py-3 text-white/50 font-medium" style={{ fontFamily: "var(--font-dachi)" }}>ფაილი</th>
                      <th className="px-4 py-3 text-white/50 font-medium" style={{ fontFamily: "var(--font-dachi)" }}>ავტორი</th>
                      <th className="px-4 py-3 text-white/50 font-medium" style={{ fontFamily: "var(--font-dachi)" }}>თარიღი</th>
                      <th className="px-4 py-3 text-white/50 font-medium" style={{ fontFamily: "var(--font-dachi)" }}>მოქმედება</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                            {item.type === "b" ? "I" : "B"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/70 font-mono text-xs">
                          {item.invoiceNumber || "-"}
                        </td>
                        <td className="px-4 py-3 text-white/70 text-xs max-w-[200px] truncate">
                          {item.fileName}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white/70 text-xs">{item.userName}</div>
                          <div className="text-white/40 text-xs">@{item.username}</div>
                        </td>
                        <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-white/10 text-white/70 hover:border-emerald-400/40 hover:text-emerald-400"
                              style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-dachi)" }}
                            >
                              {previewId === item.id ? "დახურვა" : "ნახვა"}
                            </button>
                            <a
                              href={`/api/admin/pdf/${item.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                              style={{ backgroundColor: "#307654", fontFamily: "var(--font-dachi)" }}
                            >
                              PDF
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preview panel */}
            {previewId && (
              <div
                className="mt-4 rounded-xl overflow-hidden"
                style={{ background: "#ffffff" }}
              >
                <iframe
                  src={`/api/admin/pdf/${previewId}?mode=html`}
                  className="w-full border-0"
                  style={{ height: "90vh", background: "#ffffff" }}
                  title="PDF Preview"
                />
              </div>
            )}

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      p === page
                        ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400"
                        : "border border-white/10 text-white/50 hover:border-white/30"
                    }`}
                    style={p !== page ? { backgroundColor: "rgba(255,255,255,0.06)" } : {}}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            className="text-center py-20 text-white/30"
            style={{ fontFamily: "var(--font-dachi)" }}
          >
            ისტორია ცარიელია
          </div>
        )}
        </>
        )}
      </div>
    </main>
  );
}
