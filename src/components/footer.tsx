"use client";
import { usePathname } from "next/navigation";

export default function Footer() {
	const pathname = usePathname();
	if (pathname === "/login" || pathname === "/signup") return null;
	return (
		<footer className="mt-8">
			<div className="w-full bg-gradient-to-b from-white to-[#ffe59a]">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-6 sm:py-8">
					<div className="text-2xl font-extrabold tracking-wider text-[#FFCD16]">QUESTBOARD</div>
					<div className="mt-1 text-xs sm:text-sm font-semibold text-black">JUST QUEST IT</div>
					<div className="mt-8 text-[11px] sm:text-xs text-black/70">© 2025 QUESTBOARD. All rights reserved.</div>
				</div>
			</div>
		</footer>
	);
}


