import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
	const db = getDb();
	const weekStart = url.searchParams.get('weekStart');
	const weekEnd = url.searchParams.get('weekEnd');

	if (!weekStart || !weekEnd) {
		error(400, 'weekStart and weekEnd required');
	}

	// Get all meal plan entries for the week
	const { data: entries, error: entriesErr } = await db
		.from('meal_plan_entries')
		.select('recipe_id')
		.gte('date', weekStart)
		.lte('date', weekEnd);

	if (entriesErr) throw entriesErr;
	if (!entries?.length) return json([]);

	const recipeIds = [...new Set(entries.map((e) => e.recipe_id))];

	// Get all ingredients for those recipes
	const { data: recipeIngredients, error: ingErr } = await db
		.from('recipe_ingredients')
		.select('recipe_id, quantity, unit, ingredients(name)')
		.in('recipe_id', recipeIds);

	if (ingErr) throw ingErr;
	if (!recipeIngredients?.length) return json([]);

	// Count how many times each recipe appears in the plan
	const recipeCounts: Record<string, number> = {};
	for (const entry of entries) {
		recipeCounts[entry.recipe_id] = (recipeCounts[entry.recipe_id] || 0) + 1;
	}

	// Aggregate: group by ingredient name (lowercase) + unit, sum quantities
	const aggregated = new Map<string, { name: string; quantity: number | null; unit: string | null }>();

	for (const ri of recipeIngredients) {
		const name = ((ri.ingredients as any)?.name || '').toLowerCase();
		if (!name) continue;

		const unit = ri.unit?.toLowerCase() || null;
		const key = `${name}||${unit || ''}`;
		const count = recipeCounts[ri.recipe_id] || 1;

		const existing = aggregated.get(key);
		if (existing) {
			if (existing.quantity !== null && ri.quantity !== null) {
				existing.quantity += ri.quantity * count;
			} else if (ri.quantity !== null) {
				existing.quantity = ri.quantity * count;
			}
			// If both null, keep null (ingredient with no quantity listed once)
		} else {
			aggregated.set(key, {
				name,
				quantity: ri.quantity !== null ? ri.quantity * count : null,
				unit
			});
		}
	}

	const items = [...aggregated.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

	return json(items);
};
