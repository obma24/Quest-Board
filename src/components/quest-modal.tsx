"use client";
import { useEffect } from "react";
import QuestForm from "@/components/quest-form";

type Props = { open: boolean; onClose: () => void; userId: string; editQuest?: { id: string; title: string; description: string; frequency: string; dueAt: string | null } | null };

export default function QuestModal({ open, onClose, userId, editQuest }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative w-full sm:w-[520px] bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-lg transform transition-all duration-200 translate-y-0 opacity-100">
        <div className="text-lg font-medium mb-3">{editQuest ? "Edit Quest" : "Create Quest"}</div>
        <QuestForm userId={userId} onCreated={onClose} editQuest={editQuest || null} />
        <button onClick={onClose} className="mt-4 w-full h-10 rounded-xl border border-gray-300">Close</button>
      </div>
    </div>
  );
}

