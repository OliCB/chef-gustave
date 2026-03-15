import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listRecipes, createRecipe } from '$lib/server/recipes';
import type { RecipeFormData } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	const search = url.searchParams.get('search') || undefined;
	const tag = url.searchParams.get('tag') || undefined;
	const recipes = await listRecipes(search, tag);
	return json(recipes);
};

export const POST: RequestHandler = async ({ request }) => {
	const body: RecipeFormData = await request.json();
	const id = await createRecipe(body);
	return json({ id }, { status: 201 });
};
