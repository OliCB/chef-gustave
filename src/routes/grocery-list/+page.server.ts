import type { PageServerLoad } from './$types';
import { getWeekBounds } from '$lib/week';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const offset = parseInt(url.searchParams.get('week') || '0', 10);
	const { weekStart, weekEnd } = getWeekBounds(offset);

	const res = await fetch(`/api/grocery-list?weekStart=${weekStart}&weekEnd=${weekEnd}`);
	const items = await res.json();

	return { items, weekStart, weekEnd, weekOffset: offset };
};
