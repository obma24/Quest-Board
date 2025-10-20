"use client";
import { useEffect, useState } from "react";

type Props = { userId: string };

type Profile = {
  level?: number;
  xp?: number;
  coins?: number;
  completedQuests?: number;
  dailyStreak?: number;
  badges?: string | null;
  earnedBadges?: string[] | null;
};

export default function ProfileCard({ userId }: Props) {
  const [data, setData] = useState<Profile | null>(null);
  const [xpDisplay, setXpDisplay] = useState(0);
  const [coinsDisplay, setCoinsDisplay] = useState(0);
  const [progressDisplay, setProgressDisplay] = useState(0);

  async function loadProfile() {
    try {
      const res = await fetch(`/api/profile?userId=${userId}`, { cache: "no-store" });
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const json = JSON.parse(text);
      setData(json as Profile);
    } catch {}
  }

  useEffect(() => {
    if (!userId) return;
    loadProfile();
    function refresh() { loadProfile(); }
    window.addEventListener("quests:changed", refresh);
    window.addEventListener("profile:refresh", refresh);
    return () => {
      window.removeEventListener("quests:changed", refresh);
      window.removeEventListener("profile:refresh", refresh);
    };
  }, [userId]);
  const level = data?.level ?? 1;
  const xp = data?.xp ?? 0;
  const coins = data?.coins ?? 0;
  const completed = data?.completedQuests ?? 0;
  const streak = data?.dailyStreak ?? 0;
  const earned = (data?.earnedBadges ?? []) as string[];
  function getXpForLevel(level: number) {
    return 600 + (level * 200);
  }
  const xpForNext = getXpForLevel(level);
  const targetProgress = Math.min(100, (xp / xpForNext) * 100);

  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const fromXp = xpDisplay;
    const fromCoins = coinsDisplay;
    const fromProg = progressDisplay;
    function step(t: number) {
      const k = Math.min(1, (t - start) / duration);
      const ease = k * (2 - k);
      setXpDisplay(Math.round(fromXp + (xp - fromXp) * ease));
      setCoinsDisplay(Math.round(fromCoins + (coins - fromCoins) * ease));
      setProgressDisplay(fromProg + (targetProgress - fromProg) * ease);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [xp, coins, targetProgress]);

  return (
    <div className="rounded-2xl border border-gray-200 p-6 bg-white">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs text-gray-600">
          {(() => {
            const defaultAvatar = "https://api.dicebear.com/9.x/rings/svg?seed=Default&backgroundType=gradientLinear&radius=50&backgroundColor=d6d6d6&ringColor=9e9e9e&color=9e9e9e";
            const src = (typeof data?.badges === "string" && data.badges) ? data.badges : defaultAvatar;
            return <img src={src} alt="Avatar" className="h-full w-full object-cover" />;
          })()}
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-700">Level {level}</div>
          <div className="mt-2 relative">
            <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
              <div className="h-3 rounded-full bg-[#F2C315] transition-[width] duration-200" style={{ width: `${progressDisplay}%` }}></div>
            </div>
            <span className="absolute -top-4 right-0 text-[10px] text-gray-800">{xpForNext}xp</span>
          </div>
          <div className="mt-1 text-[10px] text-gray-600">{xpDisplay} XP • {coinsDisplay} coins</div>
          <div className="mt-2 text-xs text-gray-600">Streak {streak} • Completed {completed}</div>
          {earned.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              {earned.includes("7-day-streak") && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-yellow-600"><path d="M12 2l3 6 6 .9-4.5 4.1L18 20l-6-3-6 3 1.5-7L3 8.9 9 8.1 12 2z"/></svg>
              )}
              {earned.includes("10-quests") && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-green-600"><path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h10"/><path d="M4 18h8"/></svg>
              )}
              {earned.includes("weekly-quest") && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-blue-600"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

