"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setError("Wrong username or password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ backgroundColor: "#1f2023" }}
    >
      <img
        src="/logos/back.png"
        alt=""
        className="absolute right-0 bottom-0 pointer-events-none hidden sm:block"
        style={{ maxHeight: "78vh", width: "auto" }}
      />

      <div className="w-full max-w-sm z-10">
        <h1
          className="text-3xl sm:text-4xl font-bold text-white mb-2 text-center"
          style={{ fontFamily: "var(--font-dachi)" }}
        >
          PDF გენერატორი
        </h1>
        <p
          className="mb-10 text-center"
          style={{ fontFamily: "var(--font-dachi)", color: "#307654" }}
        >
          შედი სისტემაში
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium text-white/70 mb-1"
              style={{ fontFamily: "var(--font-dachi)" }}
            >
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg outline-none transition-all text-white placeholder-white/30 border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              placeholder="Username"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-white/70 mb-1"
              style={{ fontFamily: "var(--font-dachi)" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-12 rounded-lg outline-none transition-all text-white placeholder-white/30 border border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

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
            {loading ? "შესვლა..." : "შესვლა"}
          </button>
        </form>
      </div>
    </main>
  );
}
