"use client";
import { useEffect, useState } from "react";

type Quest = { 
  id: string; 
  title: string; 
  description: string; 
  completed: boolean; 
  completedAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  frequency: string;
  xp: number;
  coins: number;
};
type Props = { userId: string };

export default function QuestHistory({ userId }: Props) {
  const [items, setItems] = useState<Quest[]>([]);
  const [showLastWeek, setShowLastWeek] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/quests", { headers: { "x-user-id": userId }, cache: "no-store" });
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (Array.isArray(data)) setItems(data);
    } catch {}
  }

  useEffect(() => {
    load();
    function onRefresh() { load(); }
    window.addEventListener("quests:changed", onRefresh);
    // schedule refresh at next local midnight
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
    const delay = Math.max(0, nextMidnight.getTime() - now.getTime());
    const t = setTimeout(() => {
      load();
    }, delay);
    return () => {
      window.removeEventListener("quests:changed", onRefresh);
      clearTimeout(t);
    };
  }, [userId]);

  function pickDate(q: Quest): Date | null {
    const d = q.completedAt || q.updatedAt || q.createdAt || null;
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function isToday(dateStr: string | null) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  function isWithinLastWeek(dateStr: string | null) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const n = new Date();
    const start = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 7);
    const end = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return d >= start && d < end; // last 7 days excluding today
  }

  function isYesterday(dateStr: string | null) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const n = new Date();
    const y = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
    return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
  }

  const todayCompleted = items.filter((q) => q.completed && isToday(pickDate(q)?.toISOString() || null));
  const yesterdayCompleted = items.filter((q) => q.completed && isYesterday(pickDate(q)?.toISOString() || null));
  const lastWeekCompleted = items.filter((q) => q.completed && isWithinLastWeek(pickDate(q)?.toISOString() || null));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm font-medium text-gray-500">Quest History</div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">Today</div>
          {todayCompleted.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-400">No quests today</div>
          ) : (
            <div className="space-y-2">
              {todayCompleted.map((q) => (
                <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-600">{q.title}</div>
                      <div className="text-sm text-gray-400">{q.description}</div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <span className="capitalize">{q.frequency.toLowerCase()}</span>
                        <span>•</span>
                        <span>{q.xp} XP</span>
                        <span>•</span>
                        <span>{q.coins} coins</span>
                      </div>
                    </div>
                    <div className="ml-3 flex items-center text-green-600">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span className="text-xs">Completed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">Yesterday</div>
          {yesterdayCompleted.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-400">No quests yesterday</div>
          ) : (
            <div className="space-y-2">
              {yesterdayCompleted.map((q) => (
                <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-600">{q.title}</div>
                      <div className="text-sm text-gray-400">{q.description}</div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <span className="capitalize">{q.frequency.toLowerCase()}</span>
                        <span>•</span>
                        <span>{q.xp} XP</span>
                        <span>•</span>
                        <span>{q.coins} coins</span>
                      </div>
                    </div>
                    <div className="ml-3 flex items-center text-green-600">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span className="text-xs">Completed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button onClick={() => setShowLastWeek((v) => !v)} className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
            <span className="text-gray-700">Last Week</span>
            <span className="text-gray-500">{showLastWeek ? "Hide" : "Show"}</span>
          </button>
          {showLastWeek && (
            <div className="mt-2 space-y-2">
              {lastWeekCompleted.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-400">No quests last week</div>
              ) : (
                lastWeekCompleted.map((q) => (
                  <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-600">{q.title}</div>
                        <div className="text-sm text-gray-400">{q.description}</div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <span className="capitalize">{q.frequency.toLowerCase()}</span>
                          <span>•</span>
                          <span>{q.xp} XP</span>
                          <span>•</span>
                          <span>{q.coins} coins</span>
                          {q.completedAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(q.completedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-3 flex items-center text-green-500 opacity-60">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        <span className="text-xs">Completed</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

