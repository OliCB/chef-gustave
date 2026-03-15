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

	const { data, error: err } = await db
		.from('meal_plan_entries')
		.select('id, date, meal_type, recipe_id, recipes(id, name)')
		.gte('date', weekStart)
		.lte('date', weekEnd)
		.order('date')
		.order('meal_type');

	if (err) throw err;

	return json(
		(data || []).map((entry: any) => ({
			...entry,
			recipe: entry.recipes
				? { id: entry.recipes.id, name: entry.recipes.name }
				: undefined,
			recipes: undefined
		}))
	);
};

export const POST: RequestHandler = async ({ request }) => {
	const db = getDb();
	const { date, meal_type, recipe_id } = await request.json();

	if (!date || !meal_type || !recipe_id) {
		error(400, 'date, meal_type, and recipe_id required');
	}

	const { data, error: err } = await db
		.from('meal_plan_entries')
		.insert({ date, meal_type, recipe_id })
		.select('id')
		.single();

	if (err) throw err;
	return json(data, { status: 201 });
};

export const DELETE: RequestHandler = async ({ url }) => {
	const db = getDb();
	const id = url.searchParams.get('id');

	if (!id) error(400, 'id required');

	const { error: err } = await db
		.from('meal_plan_entries')
		.delete()
		.eq('id', id);

	if (err) throw err;
	return json({ ok: true });
};
