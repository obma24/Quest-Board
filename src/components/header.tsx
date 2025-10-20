"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

type UserInfo = { name: string; email: string; coins?: number } | null;

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo>(null);
  const [userId, setUserId] = useState("");
const [open, setOpen] = useState(false);
const menuRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
    const u = data.user;
    if (u) {
        const n = (u.user_metadata?.name as string) || "";
        setUser({ name: n, email: u.email || "" });
        setUserId(u.id);
        loadCoins(u.id);
        fetch('/api/streak/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id }) })
          .then(()=>{ window.dispatchEvent(new Event('profile:refresh')); })
          .catch(()=>{});
    }
    });
}, []);

useEffect(() => {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    const u = session?.user;
    if (u) {
      const n = (u.user_metadata?.name as string) || "";
      setUser({ name: n, email: u.email || "" });
      setUserId(u.id);
      loadCoins(u.id);
      fetch('/api/streak/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id }) })
        .then(()=>{ window.dispatchEvent(new Event('profile:refresh')); })
        .catch(()=>{});
    } else {
      setUser(null);
      setUserId("");
    }
  });
  return () => {
    sub.subscription.unsubscribe();
  };
}, []);

useEffect(() => {
	function handlePointerDown(e: MouseEvent | TouchEvent) {
		if (!menuRef.current) return;
		const target = e.target as Node | null;
		if (target && !menuRef.current.contains(target)) {
			setOpen(false);
		}
	}
	function handleKey(e: KeyboardEvent) {
		if (e.key === "Escape") setOpen(false);
	}
	document.addEventListener("mousedown", handlePointerDown);
	document.addEventListener("touchstart", handlePointerDown, { passive: true } as AddEventListenerOptions);
	document.addEventListener("keydown", handleKey);
	return () => {
		document.removeEventListener("mousedown", handlePointerDown);
		document.removeEventListener("touchstart", handlePointerDown as EventListener);
		document.removeEventListener("keydown", handleKey);
	};
}, []);

async function loadCoins(userId: string) {
    try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        const data = await res.json();
        setUser(prev => prev ? { ...prev, coins: data.coins || 0 } : null);
    } catch {
        // ignore
    }
}

  useEffect(() => {
    function refresh() {
      if (userId) loadCoins(userId);
    }
    window.addEventListener("profile:refresh", refresh);
    window.addEventListener("quests:changed", refresh);
    return () => {
      window.removeEventListener("profile:refresh", refresh);
      window.removeEventListener("quests:changed", refresh);
    };
  }, [userId]);

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "";

  if (pathname === "/login" || pathname === "/signup") return null;

return (
    <header className="w-full border-b border-gray-200 bg-white px-4 sm:px-6 md:px-8 h-16 flex items-center relative z-50">
    <div className="mx-auto w-full max-w-7xl flex items-center justify-between">
        <Link href="/" className="text-xl sm:text-2xl font-semibold tracking-wide text-[#FFCD16]">QUESTBOARD</Link>
        {!user ? (
        <div className="flex gap-3">
            <Link href="/signup" className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm">Get Started</Link>
            <Link href="/login" className="px-4 py-2 rounded-xl border border-gray-300 text-sm">Login</Link>
        </div>
        ) : (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="relative">
                    <Image src="/Qdollarfont.png" alt="Coins" width={28} height={28} className="drop-shadow-sm" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{user.coins || 0}</span>
            </div>
            <div className="relative" ref={menuRef}>
                <button onClick={() => setOpen((v) => !v)} className="h-10 w-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
                {initial}
                </button>
            {open && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-sm p-4 z-50">
                <div className="text-sm font-semibold text-gray-900">{user.name || "User"}</div>
                <div className="text-sm text-gray-900 truncate">{user.email}</div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                    onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    setOpen(false);
                    window.location.href = "/";
                    }}
                    className="w-full h-10 rounded-lg border border-gray-300 text-sm text-gray-900"
                >
                    Logout
                </button>
                </div>
            </div>
            )}
            </div>
        </div>
        )}
    </div>
    </header>
);
}

