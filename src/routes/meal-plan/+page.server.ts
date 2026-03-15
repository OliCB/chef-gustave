import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/supabase';
import { listRecipes } from '$lib/server/recipes';

function getWeekBounds(): { weekStart: string; weekEnd: string } {
	const now = new Date();
	const day = now.getDay();
	// Monday = start of week (day 0 = Sunday, 1 = Monday, ...)
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

export const load: PageServerLoad = async () => {
	const db = getDb();
	const { weekStart, weekEnd } = getWeekBounds();

	const [entriesRes, recipes] = await Promise.all([
		db
			.from('meal_plan_entries')
			.select('id, date, meal_type, recipe_id, recipes(id, name)')
			.gte('date', weekStart)
			.lte('date', weekEnd)
			.order('date')
			.order('meal_type'),
		listRecipes()
	]);

	const entries = (entriesRes.data || []).map((entry: any) => ({
		...entry,
		recipe: entry.recipes ? { id: entry.recipes.id, name: entry.recipes.name } : undefined,
		recipes: undefined
	}));

	return {
		entries,
		recipes,
		weekStart,
		weekEnd
	};
};
