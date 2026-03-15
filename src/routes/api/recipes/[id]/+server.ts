import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRecipe, updateRecipe, deleteRecipe } from '$lib/server/recipes';
import type { RecipeFormData } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const recipe = await getRecipe(params.id);
	if (!recipe) error(404, 'Recette introuvable');
	return json(recipe);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body: RecipeFormData = await request.json();
	await updateRecipe(params.id, body);
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	await deleteRecipe(params.id);
	return json({ ok: true });
};
