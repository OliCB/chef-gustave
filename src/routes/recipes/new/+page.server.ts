import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const { data } = await getDb().from('tags').select('id, name').order('name');
	return { allTags: data || [] };
};
