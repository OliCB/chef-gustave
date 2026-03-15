import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getRecipe } from '$lib/server/recipes';
import { getDb } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
	const [recipe, tagsRes] = await Promise.all([
		getRecipe(params.id),
		getDb().from('tags').select('id, name').order('name')
	]);

	if (!recipe) error(404, 'Recette introuvable');

	return {
		recipe,
		allTags: tagsRes.data || []
	};
};
