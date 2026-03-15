import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import bcrypt from 'bcryptjs';
import { createToken } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const password = data.get('password') as string;

		if (!password) {
			return fail(400, { error: 'Mot de passe requis' });
		}

		const hash = env.AUTH_PASSWORD_HASH;
		if (!hash) throw new Error('Missing AUTH_PASSWORD_HASH');

		const valid = await bcrypt.compare(password, hash);
		if (!valid) {
			return fail(401, { error: 'Mot de passe incorrect' });
		}

		const token = await createToken();
		cookies.set('auth', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 365 * 10
		});

		throw redirect(303, '/recipes');
	}
};
