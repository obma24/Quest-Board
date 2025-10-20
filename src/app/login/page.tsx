"use client";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (tab === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
      else {
        setSuccess("you are now logged in");
        router.replace("/");
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (signUpError) setError(signUpError.message);
      else {
        setSuccess("You are now signed up");
        setTimeout(() => router.push("/"), 1200);
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#FFDE63] text-gray-800 grid md:grid-cols-2">
      <div className="relative hidden md:block">
        <img src="/justquestit.jpg" alt="Just Quest It" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs mb-4">
            <div className="flex-1 bg-gray-100 rounded-xl p-1">
              <div className="grid grid-cols-2 text-center text-sm">
                <button type="button" onClick={() => setTab("login")} className={`h-10 rounded-lg ${tab === "login" ? "bg-white shadow-sm" : ""}`}>Login</button>
                <button type="button" onClick={() => setTab("signup")} className={`h-10 rounded-lg ${tab === "signup" ? "bg-white shadow-sm" : ""}`}>Sign up</button>
              </div>
            </div>
          </div>
          <div className="text-center mb-2 text-gray-600 text-sm">Welcome back</div>
          <h1 className="text-2xl font-semibold mb-6 text-center">{tab === "login" ? "Login to QuestBoard" : "Create Account"}</h1>
          <form className="space-y-4" onSubmit={onSubmit}>
            {tab === "signup" && (
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} type="text" className="w-full h-11 rounded-xl border border-gray-300 px-3 bg-white" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full h-11 rounded-xl border border-gray-300 px-3 bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full h-11 rounded-xl border border-gray-300 px-3 bg-white" />
            </div>
            <button disabled={loading} type="submit" className="w-full h-11 rounded-xl bg-[#FFCD16] text-black hover:brightness-95">{loading ? (tab === "login" ? "Signing in..." : "Creating...") : tab === "login" ? "Sign in" : "Sign up"}</button>
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

