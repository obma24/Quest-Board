"use client";
import { useEffect, useState } from "react";

type Quest = {
  id: string;
  title: string;
  description: string;
  frequency: string;
  dueAt: string | null;
  completed: boolean;
  xp: number;
  coins: number;
};

type Props = { userId: string };

export default function QuestList({ userId }: Props) {
  const [quests, setQuests] = useState<Quest[]>([]);

  async function load() {
    const res = await fetch("/api/quests", { headers: { "x-user-id": userId } });
    const data = await res.json();
    setQuests(data);
  }

  async function complete(questId: string) {
    await fetch("/api/quests/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId, userId }),
    });
    load();
  }

  async function remove(questId: string) {
    await fetch(`/api/quests`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId }),
    });
    load();
  }

  async function setCompleted(questId: string, completed: boolean) {
    await fetch(`/api/quests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId, completed }),
    });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-3">
      {quests.map((q) => (
        <div key={q.id} className={`rounded-xl border ${q.completed ? "border-green-300" : "border-gray-200"} bg-white p-4 flex items-start justify-between`}>
          <div>
            <div className={`font-medium ${q.completed ? "text-green-700" : ""}`}>{q.title}</div>
            <div className="text-sm text-gray-600">{q.description}</div>
            <div className="text-xs text-gray-500 mt-1">{q.frequency}{q.dueAt ? ` • due ${new Date(q.dueAt).toLocaleString()}` : ""}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCompleted(q.id, true)} title="Mark complete" className={`h-8 w-8 rounded-lg flex items-center justify-center border ${q.completed ? "bg-green-600 text-white border-green-600" : "border-gray-300"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
            <button onClick={() => setCompleted(q.id, false)} title="Mark not complete" className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <button onClick={() => remove(q.id)} title="Delete" className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
            </button>
            <div className="text-xs text-gray-600">+{q.xp} XP • +{q.coins} coins</div>
          </div>
        </div>
      ))}
    </div>
  );
}

