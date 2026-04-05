import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start px-6 py-16 sm:p-36 overflow-hidden" style={{ backgroundColor: "#1f2023" }}>
      <img src="/logos/back.png" alt="" className="absolute right-0 bottom-0 pointer-events-none hidden sm:block" style={{ maxHeight: "78vh", width: "auto" }} />
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
