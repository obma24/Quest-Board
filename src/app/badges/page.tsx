"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "@/components/footer";

type Profile = {
  dailyStreak?: number;
  earnedBadges?: string[] | null;
  completedQuests?: number;
  level?: number;
  coins?: number;
};

export default function BadgesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [data, setData] = useState<Profile | null>(null);
  const [activity, setActivity] = useState<{ date: string; logins: number; completed: number }[]>([]);
  const [metric, setMetric] = useState<'completed' | 'logins'>('completed');
  const pathname = usePathname();
  function iconCls(target: string) {
    return pathname === target ? "text-[#FFCD16]" : "text-gray-700 group-hover:text-[#FFCD16]";
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) router.replace("/login");
      if (u) setUserId(u.id);
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/profile?userId=${userId}`, { cache: "no-store" })
      .then(async (r) => {
        const t = await r.text();
        if (!t) return;
        setData(JSON.parse(t));
      })
      .catch(() => {});
    fetch(`/api/activity/daily?userId=${userId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setActivity)
      .catch(() => {});
  }, [userId]);

  const streak = data?.dailyStreak ?? 0;
  const earned = (data?.earnedBadges ?? []) as string[];
  const completed = data?.completedQuests ?? 0;
  const level = data?.level ?? 1;
  const coins = data?.coins ?? 0;
  const allBadges = [
    {
      id: "7-day-streak",
      title: "7-day streak",
      desc: "Log in for 7 consecutive days",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-yellow-600">
          <path d="M12 2l3 6 6 .9-4.5 4.1L18 20l-6-3-6 3 1.5-7L3 8.9 9 8.1 12 2z"/>
        </svg>
      ),
      check: () => earned.includes("7-day-streak") || streak >= 7,
    },
    {
      id: "30-day-streak",
      title: "30-day streak",
      desc: "Log in for 30 consecutive days",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-yellow-700">
          <path d="M12 2l3 6 6 .9-4.5 4.1L18 20l-6-3-6 3 1.5-7L3 8.9 9 8.1 12 2z"/>
        </svg>
      ),
      check: () => streak >= 30,
    },
    {
      id: "first-quest",
      title: "First quest",
      desc: "Complete your first quest",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-purple-600">
          <path d="M12 5v14"/>
          <path d="M5 12h14"/>
        </svg>
      ),
      check: () => completed >= 1,
    },
    {
      id: "10-quests",
      title: "10 quests",
      desc: "Complete 10 quests total",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-green-600">
          <path d="M4 6h16"/>
          <path d="M4 10h16"/>
          <path d="M4 14h10"/>
          <path d="M4 18h8"/>
        </svg>
      ),
      check: () => earned.includes("10-quests") || completed >= 10,
    },
    {
      id: "100-quests",
      title: "100 quests",
      desc: "Complete 100 quests total",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-green-700">
          <path d="M4 6h16"/>
          <path d="M4 10h16"/>
          <path d="M4 14h16"/>
          <path d="M4 18h12"/>
        </svg>
      ),
      check: () => completed >= 100,
    },
    {
      id: "weekly-quest",
      title: "Weekly quest",
      desc: "Finish any weekly quest",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-blue-600">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v6l4 2"/>
        </svg>
      ),
      check: () => earned.includes("weekly-quest"),
    },
    {
      id: "level-5",
      title: "Level 5",
      desc: "Reach level 5",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-orange-600">
          <path d="M12 2v20"/>
          <path d="M7 17l5 5 5-5"/>
        </svg>
      ),
      check: () => level >= 5,
    },
    {
      id: "level-10",
      title: "Level 10",
      desc: "Reach level 10",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-orange-700">
          <path d="M12 2v20"/>
          <path d="M7 17l5 5 5-5"/>
        </svg>
      ),
      check: () => level >= 10,
    },
    {
      id: "rich-1000",
      title: "Coin collector",
      desc: "Hold 1000 coins",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-yellow-700">
          <circle cx="12" cy="12" r="8"/>
          <path d="M9 12h6"/>
          <path d="M12 9v6"/>
        </svg>
      ),
      check: () => coins >= 1000,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 relative overflow-hidden">
      <main className="px-4 sm:px-6 md:px-8 py-6 md:py-10 pb-24 relative z-10">
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-32 h-[110vh] w-[70vw] blur-3xl" style={{background:"radial-gradient(700px 500px at 50% 0%, rgba(255,205,22,0.35) 0%, rgba(255,205,22,0.2) 40%, rgba(255,205,22,0.0) 80%)"}}></div>
        <div className="mx-auto max-w-7xl grid gap-6 md:gap-8 md:grid-cols-[80px_1fr]">
          <aside className="hidden md:flex md:sticky md:top-24 md:self-start md:h-[calc(100vh-6rem)] md:flex-col gap-4 items-center justify-center">
            <Link href="/" className="group h-10 w-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center" aria-label="Home">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconCls('/')}` }><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/></svg>
            </Link>
            <Link href="/shop" className="group h-10 w-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center" aria-label="Shop">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${iconCls('/shop')}`}><path d="M3 9h18"/><path d="M4 9l2-4h12l2 4"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M8 13h8"/></svg>
            </Link>
            <Link href="/badges" className="group h-10 w-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center" aria-label="Profile">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconCls('/badges')}`}>
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>
              </svg>
            </Link>
          </aside>

          <section className="space-y-6">
            <h1 className="text-2xl font-semibold text-gray-900">Badges & Streaks</h1>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="text-sm text-gray-700">Daily Streak</div>
                <div className="mt-2 text-4xl font-bold text-gray-900">{streak}</div>
                <div className="mt-1 text-xs text-gray-500">Consecutive days active</div>
                {activity.length > 0 && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-700">Last 7 days</div>
                      <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-white">
                        <button onClick={() => setMetric('completed')} className={`px-2 h-7 rounded-md text-xs ${metric==='completed' ? 'bg-[#FFCD16] text-black' : 'text-gray-700 hover:bg-gray-50'}`}>Completed</button>
                        <button onClick={() => setMetric('logins')} className={`px-2 h-7 rounded-md text-xs ${metric==='logins' ? 'bg-[#FFCD16] text-black' : 'text-gray-700 hover:bg-gray-50'}`}>Logins</button>
                      </div>
                    </div>
                    <LineChart data={activity} metric={metric} />
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-gray-600">
                      <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#FFCD16] inline-block"/> {metric==='completed' ? 'Completed quests' : 'Logins'}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="text-sm text-gray-700">Badges</div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allBadges.map((b) => {
                    const done = typeof b.check === 'function' ? b.check() : earned.includes(b.id);
                    return (
                      <div key={b.id} className={`rounded-xl border p-3 ${done ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                              {b.icon}
                            </div>
                            <div className="text-sm font-medium text-gray-900">{b.title}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{done ? "Completed" : "Pending"}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600">{b.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>

        <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
          <div className="mx-auto grid grid-cols-4 gap-3 justify-items-center rounded-2xl border border-yellow-300/70 bg-[#FFF2C4]/95 backdrop-blur px-3 py-3 shadow-lg">
            <Link href="/" className="group h-12 w-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center" aria-label="Home">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconCls('/')}`}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/></svg>
            </Link>
            <Link href="/shop" className="group h-12 w-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center" aria-label="Shop">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${iconCls('/shop')}`}><path d="M3 9h18"/><path d="M4 9l2-4h12l2 4"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M8 13h8"/></svg>
            </Link>
            <Link href="/badges" className="group h-12 w-12 rounded-xl border border-gray-300 bg-white flex items-center justify-center" aria-label="Profile">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconCls('/badges')}`}>
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>
              </svg>
            </Link>
            <span className="h-12 w-12" />
          </div>
        </nav>
      </main>
        <Footer />
    </div>
  );
}

function LineChart({ data, metric }: { data: { date: string; logins: number; completed: number }[]; metric: 'completed' | 'logins' }) {
  const width = 560;
  const height = 180;
  const padding = 28;
  const points = data.map((d) => metric === 'completed' ? d.completed : d.logins);
  const max = Math.max(1, ...points);
  const stepX = (width - padding * 2) / (data.length - 1);
  function x(i: number) { return padding + i * stepX; }
  function y(v: number) { return height - padding - (v / max) * (height - padding * 2); }

  function smoothPath(vals: number[]) {
    let d = `M ${x(0)} ${y(vals[0])}`;
    for (let i = 1; i < vals.length; i++) {
      const xc = (x(i - 1) + x(i)) / 2;
      const yc = (y(vals[i - 1]) + y(vals[i])) / 2;
      d += ` Q ${x(i - 1)} ${y(vals[i - 1])}, ${xc} ${yc}`;
    }
    d += ` T ${x(vals.length - 1)} ${y(vals[vals.length - 1])}`;
    return d;
  }

  const path = smoothPath(points);
  const baseY = y(0);
  const area = `${path} L ${x(points.length - 1)} ${baseY} L ${x(0)} ${baseY} Z`;

  const ticks = 4;
  const gridYs = Array.from({ length: ticks + 1 }).map((_, i) => baseY - ((height - padding * 2) / ticks) * i);
  const labels = data.map((d) => new Date(d.date)).map((d) => `${d.getMonth()+1}/${d.getDate()}`);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFCD16" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFCD16" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {gridYs.map((gy, i) => (
        <line key={i} x1={padding} x2={width - padding} y1={gy} y2={gy} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#grad)">
        <animate attributeName="d" dur="400ms" fill="freeze" from={`M ${x(0)} ${baseY} L ${x(points.length - 1)} ${baseY} L ${x(points.length - 1)} ${baseY} L ${x(0)} ${baseY} Z`} to={area} />
      </path>
      <path d={path} fill="none" stroke="#FFCD16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="d" dur="400ms" fill="freeze" from={`M ${x(0)} ${baseY} L ${x(points.length - 1)} ${baseY}`} to={path} />
      </path>
      {points.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="3.5" fill="#fff" stroke="#FFCD16" strokeWidth="2">
            <animate attributeName="cy" dur="400ms" fill="freeze" from={baseY} to={y(v)} />
          </circle>
          <title>{`${labels[i]}: ${v}`}</title>
        </g>
      ))}
      <g>
        {labels.map((t, i) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="9" fill="#6b7280">{t}</text>
        ))}
      </g>
    </svg>
  );
}


