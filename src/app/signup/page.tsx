"use client";
import { useState } from "react";
 
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (signUpError) setError(signUpError.message);
    else {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
          await fetch('/api/shop/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, image: 'https://api.dicebear.com/9.x/rings/svg?seed=Default&backgroundType=gradientLinear&radius=50&backgroundColor=d6d6d6&ringColor=9e9e9e&color=9e9e9e' }),
          }).catch(()=>{});
        }
      } catch {}
      setSuccess("You are now signed up");
      setTimeout(() => router.push("/"), 1200);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#FFDE63] text-gray-800 grid md:grid-cols-2">
      <div className="relative hidden md:block">
        <img src="/justquestit.jpg" alt="Just Quest It" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold mb-6">Create Account</h1>
          <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" className="w-full h-11 rounded-xl border border-gray-300 px-3 bg-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full h-11 rounded-xl border border-gray-300 px-3 bg-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full h-11 rounded-xl border border-gray-300 px-3 bg-white" />
          </div>
          <button disabled={loading} type="submit" className="w-full h-11 rounded-xl bg-gray-900 text-white">{loading ? "Signing up..." : "Sign up"}</button>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
          </form>
          <div className="mt-4 text-sm text-gray-600">Already have an account? <a className="text-gray-900 underline" href="/login">Login</a></div>
        </div>
      </div>
    </div>
  );
}

