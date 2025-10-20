"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Quest = {
  id: string;
  title: string;
  description: string;
  frequency: "DAILY" | "WEEKLY" | "ONCE";
  dueAt: string | null;
  completed: boolean;
  xp: number;
  coins: number;
  completedAt?: string | null;
};

type Props = { userId: string };

export default function QuestSections({ userId }: Props) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [uncompletedIds, setUncompletedIds] = useState<string[]>([]);
  const [animatingQuests, setAnimatingQuests] = useState<Set<string>>(new Set());
  const [questPositions, setQuestPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [editing, setEditing] = useState<Quest | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());

  function storageKey() {
    return `qb_uncomplete_${userId}`;
  }

  async function load() {
    try {
      const res = await fetch("/api/quests", { headers: { "x-user-id": userId }, cache: "no-store" });
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (Array.isArray(data)) setQuests(data);
    } catch {}
  }

  useEffect(() => {
    if (!userId) return;
    load();
    function onRefresh() { load(); }
    window.addEventListener("quests:changed", onRefresh);
    return () => window.removeEventListener("quests:changed", onRefresh);
  }, [userId]);

  // Tick every 30s so approaching-deadline UI updates without reload
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey());
    if (raw) setUncompletedIds(JSON.parse(raw));
  }, [userId]);

  function saveUncompleted(next: string[]) {
    setUncompletedIds(next);
    localStorage.setItem(storageKey(), JSON.stringify(next));
  }

  async function setCompleted(questId: string, completed: boolean) {
    const questElement = document.getElementById(`quest-${questId}`);
    if (questElement) {
      const rect = questElement.getBoundingClientRect();
      setQuestPositions(prev => new Map(prev).set(questId, { x: rect.left, y: rect.top }));
    }
    
    setAnimatingQuests(prev => new Set(prev).add(questId));
    
    if (completed) {
      await fetch(`/api/quests/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, userId }),
      });
      window.dispatchEvent(new Event("profile:refresh"));
      window.dispatchEvent(new Event("quests:changed"));
      load();
      fireConfetti();
    } else {
      await fetch(`/api/quests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, completed }),
      });
      window.dispatchEvent(new Event("quests:changed"));
      load();
    }
    if (completed) {
      saveUncompleted(uncompletedIds.filter((id) => id !== questId));
    } else {
      if (!uncompletedIds.includes(questId)) saveUncompleted([...uncompletedIds, questId]);
    }
    
    setTimeout(() => {
      setAnimatingQuests(prev => {
        const next = new Set(prev);
        next.delete(questId);
        return next;
      });
      setQuestPositions(prev => {
        const next = new Map(prev);
        next.delete(questId);
        return next;
      });
      // ensure any late updates also reflected
      load();
    }, 600);
  }

  async function setNeutral(questId: string) {
    const questElement = document.getElementById(`quest-${questId}`);
    if (questElement) {
      const rect = questElement.getBoundingClientRect();
      setQuestPositions(prev => new Map(prev).set(questId, { x: rect.left, y: rect.top }));
    }
    
    setAnimatingQuests(prev => new Set(prev).add(questId));
    
    await fetch(`/api/quests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId, completed: false }),
    });
    saveUncompleted(uncompletedIds.filter((id) => id !== questId));
    window.dispatchEvent(new Event("quests:changed"));
    load();
    
    setTimeout(() => {
      setAnimatingQuests(prev => {
        const next = new Set(prev);
        next.delete(questId);
        return next;
      });
      setQuestPositions(prev => {
        const next = new Map(prev);
        next.delete(questId);
        return next;
      });
      load();
    }, 600);
  }

  async function remove(questId: string) {
    await fetch(`/api/quests`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId }),
    });
    load();
  }

  function isToday(dateStr: string | null) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  function isBeforeToday(dateStr: string | null) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const n = new Date();
    const todayStart = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return d < todayStart;
  }

  function isExpiredNow(q: Quest) {
    if (!q.dueAt || q.completed) return false;
    return new Date(q.dueAt) < new Date();
  }

  function isFuture(q: Quest) {
    if (!q.dueAt) return false;
    const d = new Date(q.dueAt);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d.getTime() >= todayStart.getTime() && !isToday(q.dueAt) && d.getTime() > now.getTime();
  }

  function msUntilDue(q: Quest): number | null {
    if (!q.dueAt) return null;
    return new Date(q.dueAt).getTime() - nowTs;
  }

  function isDueSoon(q: Quest): boolean {
    if (q.completed || !q.dueAt) return false;
    if (isFuture(q)) return false;
    const ms = msUntilDue(q);
    if (ms === null) return false;
    return ms > 0 && ms <= 2 * 60 * 60 * 1000; // within next 2 hours
  }

  function formatRemaining(ms: number): string {
    if (ms <= 0) return "now";
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }

  function loadConfetti(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).confetti) return resolve();
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
      s.async = true;
      s.onload = () => resolve();
      document.body.appendChild(s);
    });
  }

  function loadFireworksLib(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Fireworks) return resolve();
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/fireworks-js@2.10.6/dist/index.umd.js";
      s.async = true;
      s.onload = () => resolve();
      document.body.appendChild(s);
    });
  }

  async function fireConfetti() {
    await loadConfetti();
    const confetti = (window as unknown as { confetti?: (o: Record<string, unknown>) => void }).confetti;
    if (!confetti) return;
    const selected = (() => {
      try { return localStorage.getItem(`qb_anim_selected_${userId}`) || "confetti"; } catch { return "confetti"; }
    })();
    if (selected === "realfireworks") {
      await loadFireworksLib();
      const FW = (window as any).Fireworks;
      if (FW) {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.inset = "0";
        container.style.pointerEvents = "none";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
        const fw = new FW(container, { intensity: 20, opacity: 0.6, trace: 3, explosion: 6, hue: { min: 0, max: 360 }, rocketsPoint: 50 });
        fw.start();
        setTimeout(() => { fw.stop(); container.remove(); }, 1600);
      }
      return;
    }
    if (selected === "fireworks") {
      confetti({ particleCount: 120, spread: 90, startVelocity: 45, scalar: 0.9, origin: { y: 0.6 } });
      confetti({ particleCount: 80, spread: 60, startVelocity: 55, scalar: 1.1, origin: { x: 0.2, y: 0.3 } });
      confetti({ particleCount: 80, spread: 60, startVelocity: 55, scalar: 1.1, origin: { x: 0.8, y: 0.3 } });
      return;
    }
    if (selected === "burst") {
      const end = Date.now() + 800;
      (function frame() {
        confetti({ particleCount: 30, startVelocity: 45, spread: 360, ticks: 50, origin: { x: Math.random(), y: Math.random() - 0.2 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      return;
    }
    if (selected === "sparks") {
      const colors = ["#ffd700", "#ff8c00", "#ff4500"];
      const end = Date.now() + 900;
      (function frame() {
        confetti({ particleCount: 20, angle: 60, spread: 45, startVelocity: 55, colors, origin: { x: 0, y: 0.8 } });
        confetti({ particleCount: 20, angle: 120, spread: 45, startVelocity: 55, colors, origin: { x: 1, y: 0.8 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      return;
    }
    if (selected === "emoji") {
      const end = Date.now() + 1000;
      (function frame() {
        confetti({ particleCount: 12, spread: 55, scalar: 1.2, shapes: ["circle"], ticks: 100, origin: { y: 0.1 },
          // canvas-confetti supports emojis via 'emojis' in newer versions; fallback to colored circles
        } as any);
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      return;
    }
    const duration = 1200;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 9999 };
    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      const particleCount = 30 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.3 + 0.35, y: 0.2 } });
    }, 120);
  }

  function Section({ label, items }: { label: string; items: Quest[] }) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No quests available</div>
        ) : (
          <div className="space-y-2">
            {items.map((q) => (
              <div 
                id={`quest-${q.id}`}
                key={q.id} 
                className={`rounded-xl border ${q.completed ? "border-green-300" : uncompletedIds.includes(q.id) ? "border-red-300" : isFuture(q) ? "border-gray-200" : isDueSoon(q) ? "border-amber-300" : "border-gray-200"} ${isDueSoon(q) && !q.completed ? "bg-amber-50" : "bg-white"} p-4 flex items-start justify-between transition-all duration-500 ease-in-out ${animatingQuests.has(q.id) ? "transform translate-y-32 opacity-0 scale-95" : ""}`}
              >
                <div>
                  <div className={`font-medium ${q.completed ? "text-green-700" : uncompletedIds.includes(q.id) ? "text-red-700" : isFuture(q) ? "text-gray-700" : isDueSoon(q) ? "text-amber-900" : ""}`}>{q.title}</div>
                  <div className="text-sm text-gray-600">{q.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className={`capitalize ${q.frequency === "DAILY" ? "text-blue-600" : q.frequency === "WEEKLY" ? "text-red-600" : "text-purple-600"}`}>{q.frequency.toLowerCase()}</span>
                    {q.dueAt ? <span>{` • due ${new Date(q.dueAt).toLocaleString()}`}</span> : null}
                    <span>{` • +${q.xp} XP • +${q.coins} coins`}</span>
                  </div>
                  {!q.completed && isDueSoon(q) ? (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-1 text-[11px] text-amber-900" aria-live="polite">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="m10.29 3.86-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.71-3.14l-7-12a2 2 0 0 0-3.42 0Z"/></svg>
                      <span>Due in {formatRemaining(msUntilDue(q) || 0)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {isFuture(q) ? (
                    <div className="px-2 py-1 rounded-lg border border-[#FFD19A] text-xs text-black bg-[#FFF3E6] cursor-default select-none">Upcoming</div>
                  ) : (
                    <>
                      <button onClick={q.completed ? undefined : () => setCompleted(q.id, true)} title="Mark complete" className={`h-8 w-8 rounded-lg flex items-center justify-center border ${q.completed ? "bg-green-600 text-white border-green-600" : "border-gray-300 hover:bg-green-50 hover:border-green-300"} ${q.completed ? "cursor-default" : ""}`} aria-disabled={q.completed}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M20 6 9 17l-5-5"/></svg>
                      </button>
                      <button onClick={() => (uncompletedIds.includes(q.id) ? setNeutral(q.id) : setCompleted(q.id, false))} title="Mark not complete" className={`h-8 w-8 rounded-lg flex items-center justify-center border ${uncompletedIds.includes(q.id) ? "bg-red-600 text-white border-red-600" : "border-gray-300 hover:bg-red-50 hover:border-red-300"} ${q.completed ? "opacity-50 cursor-not-allowed" : ""}`} aria-disabled={q.completed} disabled={q.completed}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                      <button onClick={() => setEditing(q)} title="Edit" className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </button>
                      <button onClick={() => remove(q.id)} title="Delete" className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300 hover:bg-gray-50 hover:border-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const expiredTodayIds = quests
    .filter((q) => isExpiredNow(q) && isToday(q.dueAt))
    .map((q) => q.id);

  const upcoming = quests.filter((q) => !q.completed && isFuture(q));

  return (
    <div className="space-y-6">
      <Section label="Todays Quests" items={quests.filter((q) => q.frequency === "DAILY" && !q.completed && !uncompletedIds.includes(q.id) && !expiredTodayIds.includes(q.id) && !isFuture(q))} />
      <Section label="Weekly Quests" items={quests.filter((q) => q.frequency === "WEEKLY" && !q.completed && !uncompletedIds.includes(q.id) && !expiredTodayIds.includes(q.id) && !isFuture(q))} />
      <Section label="One-time Quests" items={quests.filter((q) => q.frequency === "ONCE" && !q.completed && !uncompletedIds.includes(q.id) && !expiredTodayIds.includes(q.id) && !isFuture(q))} />
      <Section label="Upcoming" items={upcoming} />
      {editing && createPortal(
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 z-0" onClick={() => setEditing(null)}></div>
          <div className="relative z-10 w-full sm:w-[520px] bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-lg">
            <div className="text-lg font-medium mb-3 text-gray-900">Edit Quest</div>
            <EditQuestForm quest={editing} onClose={() => { setEditing(null); load(); }} />
            <button onClick={() => setEditing(null)} className="mt-4 w-full h-10 rounded-xl border border-gray-300 text-gray-900">Close</button>
          </div>
        </div>,
        document.body
      )}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Todays Status</div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Completed</div>
            {(() => {
              const items = quests.filter((q) => q.completed && isToday((q.completedAt as string | null)));
              return (
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No quests available</div>
                  ) : (
                    items.map((q) => (
                      <div 
                id={`quest-${q.id}`}
                key={q.id} 
                className={`rounded-xl border ${q.completed ? "border-green-300" : uncompletedIds.includes(q.id) ? "border-red-300" : "border-gray-200"} bg-white p-4 flex items-start justify-between transition-all duration-500 ease-in-out ${animatingQuests.has(q.id) ? "transform translate-y-32 opacity-0 scale-95" : ""}`}
              >
                        <div>
                          <div className={`font-medium ${q.completed ? "text-green-700" : uncompletedIds.includes(q.id) ? "text-red-700" : ""}`}>{q.title}</div>
                          <div className="text-sm text-gray-600">{q.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className={`capitalize ${q.frequency === "DAILY" ? "text-blue-600" : q.frequency === "WEEKLY" ? "text-red-600" : "text-purple-600"}`}>{q.frequency.toLowerCase()}</span>
                            {q.dueAt ? <span>{` • due ${new Date(q.dueAt).toLocaleString()}`}</span> : null}
                            <span>{` • +${q.xp} XP • +${q.coins} coins`}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className={`h-8 w-8 rounded-lg flex items-center justify-center border bg-green-600 text-white border-green-600 cursor-default`} aria-disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M20 6 9 17l-5-5"/></svg>
                          </button>
                          <button className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300 opacity-50 cursor-not-allowed" aria-disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
                          </button>
                          <button onClick={() => setEditing(q)} title="Edit" className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          </button>
                          <button onClick={() => remove(q.id)} title="Delete" className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300 hover:bg-gray-50 hover:border-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Not Completed</div>
            {(() => {
              const items = quests.filter((q) => uncompletedIds.includes(q.id) || expiredTodayIds.includes(q.id));
              return (
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No quests available</div>
                  ) : (
                    items.map((q) => (
                      <div 
                id={`quest-${q.id}`}
                key={q.id} 
                className={`rounded-xl border ${q.completed ? "border-green-300" : uncompletedIds.includes(q.id) ? "border-red-300" : "border-gray-200"} bg-white p-4 flex items-start justify-between transition-all duration-500 ease-in-out ${animatingQuests.has(q.id) ? "transform translate-y-32 opacity-0 scale-95" : ""}`}
              >
                        <div>
                          <div className={`font-medium ${q.completed ? "text-green-700" : uncompletedIds.includes(q.id) ? "text-red-700" : ""}`}>{q.title}</div>
                          <div className="text-sm text-gray-600">{q.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className={`capitalize ${q.frequency === "DAILY" ? "text-blue-600" : q.frequency === "WEEKLY" ? "text-red-600" : "text-purple-600"}`}>{q.frequency.toLowerCase()}</span>
                            {q.dueAt ? <span>{` • due ${new Date(q.dueAt).toLocaleString()}`}</span> : null}
                            <span>{` • +${q.xp} XP • +${q.coins} coins`}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setCompleted(q.id, true)} title="Mark complete" className={`h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300 hover:bg-green-50 hover:border-green-300`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M20 6 9 17l-5-5"/></svg>
                          </button>
                          <button onClick={() => setNeutral(q.id)} title="Clear" className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300 hover:bg-red-50 hover:border-red-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
                          </button>
                          <button onClick={() => setEditing(q)} title="Edit" className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          </button>
                          <button onClick={() => remove(q.id)} title="Delete" className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300 hover:bg-gray-50 hover:border-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditQuestForm({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const [title, setTitle] = useState(quest.title);
  const [description, setDescription] = useState(quest.description);
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "ONCE">(quest.frequency);
  const [dueAt, setDueAt] = useState(quest.dueAt ? new Date(quest.dueAt).toISOString().slice(0,16) : "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/quests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId: quest.id, title, description, frequency, dueAt: dueAt || null }),
    });
    setSaving(false);
    if (res.ok) {
      window.dispatchEvent(new Event("quests:changed"));
      onClose();
    } else {
      const t = await res.json().catch(() => ({}));
      alert(t?.error || "Failed to save quest");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full h-11 rounded-xl border border-gray-300 px-3 bg-white text-gray-900" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-xl border border-gray-300 px-3 py-2 bg-white h-24 text-gray-900" />
      <div className="grid grid-cols-2 gap-3">
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="h-11 rounded-xl border border-gray-300 px-3 bg-white text-gray-900">
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="ONCE">One time</option>
        </select>
        <input value={dueAt} onChange={(e) => setDueAt(e.target.value)} type="datetime-local" className="h-11 rounded-xl border border-gray-300 px-3 bg-white text-gray-900" />
      </div>
      <button disabled={saving} className="h-11 rounded-xl bg-gray-900 text-white w-full">{saving ? "Saving..." : "Save Changes"}</button>
    </form>
  );
}
