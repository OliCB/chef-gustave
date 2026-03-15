import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';

function getSecret() {
	const secret = env.JWT_SECRET;
	if (!secret) throw new Error('Missing JWT_SECRET');
	return new TextEncoder().encode(secret);
}

export async function createToken(): Promise<string> {
	return new SignJWT({ role: 'household' })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.sign(getSecret());
}

export async function verifyToken(token: string): Promise<boolean> {
	try {
		await jwtVerify(token, getSecret());
		return true;
	} catch {
		return false;
	}
}
