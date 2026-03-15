import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
	const db = getDb();
	const search = url.searchParams.get('q') || '';

	let query = db.from('ingredients').select('id, name').order('name');
	if (search) {
		query = query.ilike('name', `%${search}%`);
	}

	const { data, error: err } = await query.limit(20);
	if (err) throw err;
	return json(data || []);
};
