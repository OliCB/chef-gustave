import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
		return resolve(event);
	}

	const token = event.cookies.get('auth');
	if (!token || !(await verifyToken(token))) {
		throw redirect(303, '/login');
	}

	event.locals.authenticated = true;
	return resolve(event);
};
