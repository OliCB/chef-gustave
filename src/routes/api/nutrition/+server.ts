import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/supabase';
import { getRecipe } from '$lib/server/recipes';

export const POST: RequestHandler = async ({ request }) => {
	const { recipe_id } = await request.json();
	if (!recipe_id) error(400, 'recipe_id required');

	const appId = env.EDAMAM_APP_ID;
	const appKey = env.EDAMAM_APP_KEY;
	if (!appId || !appKey) error(500, 'Edamam API credentials missing');

	const recipe = await getRecipe(recipe_id);
	if (!recipe) error(404, 'Recette introuvable');

	// Build ingredient lines for Edamam
	const ingredientLines = recipe.ingredients.map((ing) => {
		const parts: string[] = [];
		if (ing.quantity) parts.push(String(ing.quantity));
		if (ing.unit) parts.push(ing.unit);
		parts.push(ing.name);
		return parts.join(' ');
	});

	// Call Edamam Nutrition Analysis API
	const edamamUrl = `https://api.edamam.com/api/nutrition-details?app_id=${appId}&app_key=${appKey}`;
	const res = await fetch(edamamUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			title: recipe.name,
			ingr: ingredientLines
		})
	});

	if (!res.ok) {
		const text = await res.text();
		console.error('Edamam error:', res.status, text);
		error(502, 'Erreur Edamam API');
	}

	const data = await res.json();
	const servings = recipe.servings || 1;

	const nutrition = {
		recipe_id,
		calories: data.calories ? Math.round(data.calories / servings) : null,
		protein: data.totalNutrients?.PROCNT?.quantity
			? Math.round((data.totalNutrients.PROCNT.quantity / servings) * 10) / 10
			: null,
		carbs: data.totalNutrients?.CHOCDF?.quantity
			? Math.round((data.totalNutrients.CHOCDF.quantity / servings) * 10) / 10
			: null,
		fat: data.totalNutrients?.FAT?.quantity
			? Math.round((data.totalNutrients.FAT.quantity / servings) * 10) / 10
			: null,
		fiber: data.totalNutrients?.FIBTG?.quantity
			? Math.round((data.totalNutrients.FIBTG.quantity / servings) * 10) / 10
			: null
	};

	// Upsert into database
	const db = getDb();
	const { error: dbErr } = await db
		.from('nutrition_info')
		.upsert(nutrition, { onConflict: 'recipe_id' });

	if (dbErr) throw dbErr;

	return json(nutrition);
};

export const GET: RequestHandler = async ({ url }) => {
	const recipeId = url.searchParams.get('recipe_id');
	if (!recipeId) error(400, 'recipe_id required');

	const db = getDb();
	const { data, error: dbErr } = await db
		.from('nutrition_info')
		.select('*')
		.eq('recipe_id', recipeId)
		.single();

	if (dbErr && dbErr.code !== 'PGRST116') throw dbErr;

	return json(data);
};
