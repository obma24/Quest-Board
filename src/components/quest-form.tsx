"use client";
import { useState } from "react";

type Props = { userId: string; onCreated?: () => void; editQuest?: { id: string; title: string; description: string; frequency: string; dueAt: string | null } | null };

export default function QuestForm({ userId, onCreated, editQuest }: Props) {
  const [title, setTitle] = useState(editQuest?.title || "");
  const [description, setDescription] = useState(editQuest?.description || "");
  const [frequency, setFrequency] = useState(editQuest?.frequency || "DAILY");
  const [dueAt, setDueAt] = useState(editQuest?.dueAt ? new Date(editQuest.dueAt).toISOString().slice(0,16) : "");
  const [loading, setLoading] = useState(false);

  function defaultsForFrequency(f: string) {
    if (f === "DAILY") return { xp: 50, coins: 5 };
    if (f === "WEEKLY") return { xp: 120, coins: 12 };
    if (f === "ONCE") return { xp: 80, coins: 8 };
    return { xp: 50, coins: 5 };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const creating = !editQuest;
    const res = creating
      ? await fetch("/api/quests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, title, description, frequency, dueAt: dueAt || null }),
        })
      : await fetch("/api/quests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questId: editQuest?.id, title, description, frequency, dueAt: dueAt || null }),
        });
    setLoading(false);
    if (res.ok) {
      setTitle("");
      setDescription("");
      window.dispatchEvent(new Event("quests:changed"));
      if (onCreated) onCreated();
    }
    if (!res.ok) {
      const t = await res.json().catch(() => ({}));
      alert(t?.error || "Failed to create quest");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full h-11 rounded-xl border border-gray-300 px-3 bg-white" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-xl border border-gray-300 px-3 py-2 bg-white h-24" />
      <div className="grid grid-cols-2 gap-3">
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="h-11 rounded-xl border border-gray-300 px-3 bg-white">
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="ONCE">One time</option>
        </select>
        <input value={dueAt} onChange={(e) => setDueAt(e.target.value)} type="datetime-local" className="h-11 rounded-xl border border-gray-300 px-3 bg-white" />
      </div>
      <div className="text-xs text-gray-600">+{defaultsForFrequency(frequency).xp} XP • +{defaultsForFrequency(frequency).coins} coins</div>
      <button disabled={loading} className="h-11 rounded-xl bg-gray-900 text-white w-full">{loading ? "Saving..." : (editQuest ? "Save Changes" : "Create Quest")}</button>
    </form>
  );
}

