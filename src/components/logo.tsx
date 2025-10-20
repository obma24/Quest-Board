import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image 
        src="/favicon.ico" 
        alt="QuestBoard Logo" 
        width={32} 
        height={32}
        className="rounded-lg"
      />
      <span className="text-xl font-bold text-gray-900">QuestBoard</span>
    </div>
  );
}
