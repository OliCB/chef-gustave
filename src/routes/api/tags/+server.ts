import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
	const db = getDb();
	const { data, error: err } = await db
		.from('tags')
		.select('id, name')
		.order('name');

	if (err) throw err;
	return json(data || []);
};
