"use client";
import QuestModal from "@/components/quest-modal";
import QuestSections from "@/components/quest-sections";
import ProfileCard from "@/components/profile-card";
import QuestHistory from "@/components/quest-history";
import Footer from "@/components/footer";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Home() {
  const [userId, setUserId] = useState("");
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  function iconCls(target: string) {
    return pathname === target ? "text-[#FFCD16]" : "text-gray-700 group-hover:text-[#FFCD16]";
  }
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) router.replace("/login");
      if (u) setUserId(u.id);
      setChecking(false);
    });
  }, [router]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || "";
      if (!uid) return;
      setUserId(uid);
      window.dispatchEvent(new Event("profile:refresh"));
      window.dispatchEvent(new Event("quests:changed"));
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);
  if (checking) return null;
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <main className="relative px-4 sm:px-6 min-[930px]:px-8 py-6 min-[930px]:py-10 pb-24 overflow-hidden">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[120vh] w-[80vw] blur-3xl" style={{background:"radial-gradient(800px 600px at 10% 10%, rgba(255,205,22,0.35) 0%, rgba(255,205,22,0.2) 40%, rgba(255,205,22,0.0) 80%)"}}></div>
        <div className="relative z-10 mx-auto max-w-7xl grid gap-6 min-[930px]:gap-8 min-[930px]:grid-cols-[80px_1fr_360px]">
          <aside className="hidden min-[930px]:flex min-[930px]:sticky min-[930px]:top-24 min-[930px]:self-start min-[930px]:h-[calc(100vh-6rem)] min-[930px]:flex-col gap-4 items-center justify-center">
            <Link href="/" className="group h-10 w-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center" aria-label="Home">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconCls('/')}`}>
                <path d="M3 10.5 12 3l9 7.5"/>
                <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/>
              </svg>
            </Link>
            <Link href="/shop" className="group h-10 w-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center" aria-label="Shop">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${iconCls('/shop')}`}>
                <path d="M3 9h18"/>
                <path d="M4 9l2-4h12l2 4"/>
                <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/>
                <path d="M8 13h8"/>
              </svg>
            </Link>
            <Link href="/badges" className="group h-10 w-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center" aria-label="Profile">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconCls('/badges')}`}>
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>
              </svg>
            </Link>
            
          </aside>
          <section className="order-2 min-[930px]:order-2 space-y-6">
            {userId && <QuestSections userId={userId} />}
          </section>
          <aside className="order-1 min-[930px]:order-3 space-y-4">
            {userId && <ProfileCard userId={userId} />}
            {userId && (
              <button onClick={() => setOpen(true)} className="w-full h-11 rounded-xl bg-[#FFCD16] text-black hover:brightness-95">Create a Quest</button>
            )}
            <div className="hidden min-[930px]:block">
              {userId && <QuestHistory userId={userId} />}
            </div>
          </aside>
        </div>
        <div className="relative min-[930px]:hidden mt-8">
          {userId && <QuestHistory userId={userId} />}
        </div>
        <nav className="min-[930px]:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
          <div className="mx-auto grid grid-cols-3 gap-3 justify-items-center rounded-2xl border border-yellow-300/70 bg-[#FFF2C4]/95 backdrop-blur px-3 py-3 shadow-lg">
            <Link href="/" className="h-12 w-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center" aria-label="Home">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M3 10.5 12 3l9 7.5"/>
                <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/>
              </svg>
            </Link>
            <Link href="/shop" className="h-12 w-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center" aria-label="Shop">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M3 9h18"/>
                <path d="M4 9l2-4h12l2 4"/>
                <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/>
                <path d="M8 13h8"/>
              </svg>
            </Link>
            <Link href="/badges" className="h-12 w-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center" aria-label="Profile">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>
              </svg>
            </Link>
            
          </div>
        </nav>
      </main>
      {userId && <QuestModal open={open} onClose={() => setOpen(false)} userId={userId} />}
      <Footer />
    </div>
  );
}
