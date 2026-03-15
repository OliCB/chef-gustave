import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getRecipe } from '$lib/server/recipes';
import { getDb } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
	const [recipe, nutritionRes] = await Promise.all([
		getRecipe(params.id),
		getDb()
			.from('nutrition_info')
			.select('*')
			.eq('recipe_id', params.id)
			.single()
	]);

	if (!recipe) error(404, 'Recette introuvable');

	return {
		recipe,
		nutrition: nutritionRes.data || null
	};
};
