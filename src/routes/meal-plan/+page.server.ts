import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/supabase';
import { listRecipes } from '$lib/server/recipes';
import { getWeekBounds } from '$lib/week';

export const load: PageServerLoad = async ({ url }) => {
	const db = getDb();
	const offset = parseInt(url.searchParams.get('week') || '0', 10);
	const { weekStart, weekEnd } = getWeekBounds(offset);

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
		weekEnd,
		weekOffset: offset
	};
};
