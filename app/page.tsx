"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start px-6 py-16 sm:p-36 overflow-hidden" style={{ backgroundColor: "#1f2023" }}>
      <img src="/logos/back.png" alt="" className="absolute right-0 bottom-0 pointer-events-none hidden sm:block" style={{ maxHeight: "78vh", width: "auto" }} />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-8 sm:right-8 flex items-center justify-between z-20" style={{ fontFamily: "var(--font-dachi)" }}>
        {session?.user?.role === "ADMIN" && (
          <div className="text-white/50 text-sm">
            მოგესალმებით, <span className="text-white/80">{session?.user?.name}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
        {session?.user?.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-white/10 text-white/70 hover:border-emerald-400/40 hover:text-emerald-400"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            ისტორიის ნახვა
          </Link>
        )}
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
          className="p-2 rounded-lg transition-all border border-white/10 text-white/50 hover:border-red-400/40 hover:text-red-400"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          title="გასვლა"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-dachi)" }}>PDF გენერატორი</h1>
      <p className="mb-12 text-center max-w-md" style={{ fontFamily: "var(--font-dachi)", color: "#307654" }}>
        აირჩიე <span  style={{ color: "#fff" }}>PDF</span>  ტიპი, შეავსე ყველა მოთხოვნილი ინფორმაცია და შემდეგ გადმოწერე
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl z-10" style={{ fontFamily: "var(--font-dachi)" }}>
        <Link
          href="/a"
          className="group relative block p-6 rounded-2xl border border-white/10 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-emerald-400/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)" }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg backdrop-blur-sm">
              B
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Booking Order
            </h2>
          </div>

          <div className="mt-4 flex items-center text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            მიდი →
          </div>
        </Link>

        <Link
          href="/b"
          className="group relative block p-6 rounded-2xl border border-white/10 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-emerald-400/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)" }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg backdrop-blur-sm">
              I
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Invoice
            </h2>
          </div>

          <div className="mt-4 flex items-center text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            მიდი →
          </div>
        </Link>
      </div>
    </main>
  );
}
