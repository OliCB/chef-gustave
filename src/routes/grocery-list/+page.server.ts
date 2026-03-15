import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/supabase';

function getWeekBounds(): { weekStart: string; weekEnd: string } {
	const now = new Date();
	const day = now.getDay();
	const diff = day === 0 ? 6 : day - 1;
	const monday = new Date(now);
	monday.setDate(now.getDate() - diff);
	monday.setHours(0, 0, 0, 0);

	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);

	return {
		weekStart: monday.toISOString().split('T')[0],
		weekEnd: sunday.toISOString().split('T')[0]
	};
}

export const load: PageServerLoad = async ({ fetch }) => {
	const { weekStart, weekEnd } = getWeekBounds();

	const res = await fetch(`/api/grocery-list?weekStart=${weekStart}&weekEnd=${weekEnd}`);
	const items = await res.json();

	return { items, weekStart, weekEnd };
};
