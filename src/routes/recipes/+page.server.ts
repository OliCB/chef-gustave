import type { PageServerLoad } from './$types';
import { listRecipes } from '$lib/server/recipes';
import { getDb } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q') || undefined;
	const tag = url.searchParams.get('tag') || undefined;

	const [recipes, tagsRes] = await Promise.all([
		listRecipes(search, tag),
		getDb().from('tags').select('id, name').order('name')
	]);

	return {
		recipes,
		tags: tagsRes.data || [],
		search: search || '',
		activeTag: tag || ''
	};
};
