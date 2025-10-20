import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const base = "https://api.dicebear.com/9.x/rings/svg";
const seeds = [
  { id: "default", name: "Default", cost: 0, seed: "Default" },
  { id: "avatar1", name: "Explorer", cost: 5, seed: "Explorer" },
  { id: "avatar2", name: "Knight", cost: 80, seed: "Knight" },
  { id: "avatar3", name: "Mage", cost: 120, seed: "Mage" },
  { id: "avatar4", name: "Rogue", cost: 60, seed: "Rogue" },
  { id: "avatar6", name: "Ranger", cost: 70, seed: "Ranger" },
  { id: "avatar7", name: "Paladin", cost: 110, seed: "Paladin" },
  { id: "avatar8", name: "Scholar", cost: 55, seed: "Scholar" },
];

const query = "backgroundType=gradientLinear&radius=50";
const ITEMS = seeds.map((s) => {
  const common = `${base}?seed=${encodeURIComponent(s.seed)}&${query}`;
  const image = s.id === "default"
    ? `${common}&backgroundColor=d6d6d6&ringColor=9e9e9e&color=9e9e9e`
    : common;
  return {
    id: s.id,
    name: s.name,
    cost: s.cost,
    image,
  };
});

export async function GET() {
  return NextResponse.json(ITEMS);
}


