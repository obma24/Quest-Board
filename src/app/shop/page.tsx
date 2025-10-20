"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "@/components/footer";

type Item = { id: string; name: string; cost: number; image: string };

export default function ShopPage() {
  const pathname = usePathname();
  function iconCls(target: string) {
    return pathname === target ? "text-[#FFCD16]" : "text-gray-700 group-hover:text-[#FFCD16]";
  }
  const [items, setItems] = useState<Item[]>([]);
  const [userId, setUserId] = useState("");
  const [buying, setBuying] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [owned, setOwned] = useState<string[]>([]);
  const [applied, setApplied] = useState<string>("");
  const confettiVariants = [
    { id: "confetti", name: "Default (Confetti)", cost: 0 },
    { id: "burst", name: "Burst", cost: 15 },
    { id: "fireworks", name: "Explosion", cost: 25 },
    { id: "sparks", name: "Sparks", cost: 18 },
  ];
  const animationItems = [
    { id: "emoji", name: "Emoji Rain", cost: 22 },
  ];
  const [ownedAnims, setOwnedAnims] = useState<string[]>([]);
  const [selectedAnim, setSelectedAnim] = useState<string>("");

  useEffect(() => {
    fetch("/api/shop/items").then((r) => r.json()).then(setItems);
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id || "";
      setUserId(id);
      if (id) {
        const res = await fetch(`/api/profile?userId=${id}`, { cache: "no-store" });
        const json = await res.json();
        setCoins(json?.coins ?? 0);
        if (typeof json?.badges === "string") setApplied(json.badges);
        try {
          const raw = localStorage.getItem(`qb_owned_${id}`);
          if (raw) setOwned(JSON.parse(raw));
          const rawAnim = localStorage.getItem(`qb_owned_anim_${id}`);
          if (rawAnim) setOwnedAnims(JSON.parse(rawAnim));
          const selAnim = localStorage.getItem(`qb_anim_selected_${id}`) || "";
          setSelectedAnim(selAnim);
        } catch {}
      }
    });
  }, []);

  async function buy(item: Item) {
    if (!userId) return;
    setBuying(item.id);
    const res = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, itemId: item.id, cost: item.cost, image: item.image }),
    });
    setBuying(null);
    if (res.ok) {
      setCoins((c) => c - item.cost);
      setOwned((prev) => {
        const next = Array.from(new Set([...(prev || []), item.image]));
        try { localStorage.setItem(`qb_owned_${userId}`, JSON.stringify(next)); } catch {}
        return next;
      });
      window.dispatchEvent(new Event("profile:refresh"));
    } else {
      const t = await res.json().catch(() => ({}));
      alert(t?.error || "Purchase failed");
    }
  }

  async function apply(item: Item) {
    if (!userId) return;
    const res = await fetch("/api/shop/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, image: item.image }),
    });
    if (res.ok) {
      setApplied(item.image);
      window.dispatchEvent(new Event("profile:refresh"));
    } else {
      const t = await res.json().catch(() => ({}));
      alert(t?.error || "Apply failed");
    }
  }

  async function buyAnim(itemId: string, cost: number) {
    if (!userId) return;
    setBuying(itemId);
    const res = await fetch("/api/shop/buy-anim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cost }),
    });
    setBuying(null);
    if (res.ok) {
      setCoins((c) => c - cost);
      setOwnedAnims((prev) => {
        const next = Array.from(new Set([...(prev || []), itemId]));
        try { localStorage.setItem(`qb_owned_anim_${userId}`, JSON.stringify(next)); } catch {}
        return next;
      });
    } else {
      const t = await res.json().catch(() => ({}));
      alert(t?.error || "Purchase failed");
    }
  }

  function applyAnim(itemId: string) {
    if (!userId) return;
    try {
      localStorage.setItem(`qb_anim_selected_${userId}`, itemId);
      setSelectedAnim(itemId);
      window.dispatchEvent(new Event("profile:refresh"));
    } catch {}
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 relative overflow-hidden">
      <main className="px-4 sm:px-6 md:px-8 py-6 md:py-10 pb-24 relative z-10">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[120vh] w-[80vw] blur-3xl" style={{background:"radial-gradient(800px 600px at 90% 10%, rgba(255,205,22,0.35) 0%, rgba(255,205,22,0.2) 40%, rgba(255,205,22,0.0) 80%)"}}></div>
        <div className="mx-auto max-w-7xl grid gap-6 md:gap-8 md:grid-cols-[80px_1fr]">
          <aside className="hidden md:flex md:sticky md:top-24 md:self-start md:h-[calc(100vh-6rem)] md:flex-col gap-4 items-center justify-center">
            <Link href="/" className="group h-10 w-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center" aria-label="Home">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconCls('/')}`}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/></svg>
            </Link>
            <Link href="/shop" className="group h-10 w-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center" aria-label="Shop">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${iconCls('/shop')}`}><path d="M3 9h18"/><path d="M4 9l2-4h12l2 4"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M8 13h8"/></svg>
            </Link>
            <Link href="/badges" className="group h-10 w-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center" aria-label="Profile">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconCls('/badges')}`}><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>
            </Link>
            
          </aside>

          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Shop</h1>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <Image src="/Qdollarfont.png" alt="Coins" width={24} height={24} className="drop-shadow-sm" />
                <span className="text-sm font-semibold text-gray-800">{coins}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Avatars</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((it) => {
                  const canAfford = coins >= it.cost;
                  const buyingThis = buying === it.id;
                  const isOwned = owned.includes(it.image);
                  const isDefault = it.id === "default";
                  return (
                    <div key={it.id} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-full h-28 md:h-32 rounded-xl bg-gray-50 border border-gray-100 relative overflow-hidden">
                        <img src={it.image} alt={it.name} className="absolute inset-0 h-full w-full object-contain p-2" />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm font-medium truncate">{it.name}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-700">
                          <Image src="/Qdollarfont.png" alt="Coins" width={16} height={16} />
                          <span>{it.cost}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        {isOwned || isDefault ? (
                          applied === it.image ? (
                            <div className="w-full h-9 rounded-xl bg-green-50 text-green-700 text-sm flex items-center justify-center border border-green-200">Applied</div>
                          ) : (
                            <button onClick={() => apply(it)} className="w-full h-9 rounded-xl border border-gray-300 text-sm hover:bg-gray-50">Apply</button>
                          )
                        ) : (
                          <button onClick={() => buy(it)} disabled={!canAfford || buyingThis} className={`w-full h-9 rounded-xl text-sm ${canAfford ? "bg-gray-900 text-white hover:bg-black" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>{buyingThis ? "Buying..." : canAfford ? "Buy" : "Not enough"}</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700">Animation completions</div>
              {(() => {
                const allAnims = [...confettiVariants, ...animationItems];
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allAnims.map((v) => {
                      const isOwned = v.id === 'confetti' || ownedAnims.includes(v.id);
                      const isApplied = (selectedAnim ? selectedAnim === v.id : v.id === 'confetti');
                      const canAfford = coins >= v.cost;
                      const buyingThis = buying === v.id;
                      return (
                        <div key={v.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="relative rounded-xl border border-gray-200 bg-white h-28 flex items-center justify-center">
                            <div className="text-base font-medium text-gray-900">{v.name}</div>
                            <div className="absolute right-4 top-3 flex items-center gap-1 text-xs text-gray-700">
                              <img src="/Qdollarfont.png" alt="Coins" className="h-4 w-4" />
                              <span>{v.cost}</span>
                            </div>
                            {isOwned ? (
                              isApplied ? (
                                <div className="absolute right-4 bottom-3 px-4 h-9 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm flex items-center justify-center">Applied</div>
                              ) : (
                                <button onClick={() => applyAnim(v.id)} className="absolute right-4 bottom-3 h-9 px-4 rounded-xl border border-gray-300 text-sm hover:bg-gray-50">Apply</button>
                              )
                            ) : (
                              <button onClick={() => buyAnim(v.id, v.cost)} disabled={!canAfford || buyingThis} className={`absolute right-4 bottom-3 h-9 px-4 rounded-xl text-sm ${canAfford ? "bg-gray-900 text-white hover:bg-black" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>{buyingThis ? "Buying..." : canAfford ? "Buy" : "Not enough"}</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </section>
        </div>

        <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
          <div className="mx-auto grid grid-cols-3 gap-3 justify-items-center rounded-2xl border border-yellow-300/70 bg-[#FFF2C4]/95 backdrop-blur px-3 py-3 shadow-lg">
            <Link href="/" className="h-12 w-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center" aria-label="Home">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/></svg>
            </Link>
            <Link href="/shop" className="h-12 w-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center" aria-label="Shop">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 9h18"/><path d="M4 9l2-4h12l2 4"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M8 13h8"/></svg>
            </Link>
            <Link href="/badges" className="group h-12 w-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center" aria-label="Profile">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconCls('/badges')}`}><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>
            </Link>
            
          </div>
        </nav>
      </main>
      <Footer />
    </div>
  );
}


