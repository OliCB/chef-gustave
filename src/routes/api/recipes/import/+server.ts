import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import Anthropic from '@anthropic-ai/sdk';

const EXTRACTION_PROMPT = `You are a recipe extraction assistant. Extract the recipe from the provided content and return it as a JSON object.

IMPORTANT RULES:
- All text must be in French (Québécois). Translate if the source is in another language.
- Parse ingredients into structured fields: quantity (number or null), unit (string or null), name (string).
- Use metric units where reasonable, but keep the original if it's already French/metric.
- Fractions should be converted to decimals (e.g., 1/2 → 0.5, 1 1/2 → 1.5).

Return ONLY valid JSON with this exact structure:
{
  "name": "string",
  "servings": number or null,
  "prep_time": number or null (in minutes),
  "cook_time": number or null (in minutes),
  "ingredients": [
    { "name": "string", "quantity": number or null, "unit": "string or null" }
  ],
  "steps": ["string"],
  "tags": ["string"],
  "notes": "string or null"
}`;

function extractJsonLd(html: string): Record<string, any> | null {
	const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
	let match;
	while ((match = regex.exec(html)) !== null) {
		try {
			const data = JSON.parse(match[1]);
			// Could be a single object or array
			if (Array.isArray(data)) {
				const recipe = data.find((d: any) => d['@type'] === 'Recipe');
				if (recipe) return recipe;
			} else if (data['@type'] === 'Recipe') {
				return data;
			} else if (data['@graph']) {
				const recipe = data['@graph'].find((d: any) => d['@type'] === 'Recipe');
				if (recipe) return recipe;
			}
		} catch {
			// Invalid JSON, try next
		}
	}
	return null;
}

export const POST: RequestHandler = async ({ request }) => {
	const { url } = await request.json();
	if (!url || typeof url !== 'string') {
		error(400, 'URL requise');
	}

	const apiKey = env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		error(500, 'Clé API Anthropic manquante');
	}

	// Fetch the page HTML
	let html: string;
	try {
		const res = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; ChefGustave/1.0)',
				Accept: 'text/html'
			}
		});
		if (!res.ok) error(400, `Impossible de récupérer la page (${res.status})`);
		html = await res.text();
	} catch (e: any) {
		if (e.status) throw e;
		error(400, 'Impossible de récupérer la page');
	}

	// Try JSON-LD first
	const jsonLd = extractJsonLd(html);

	let contentForClaude: string;
	if (jsonLd) {
		contentForClaude = `Here is structured recipe data (JSON-LD) extracted from a web page. Parse the ingredients into structured fields and translate everything to French:\n\n${JSON.stringify(jsonLd, null, 2)}`;
	} else {
		// Trim HTML to a reasonable size
		const trimmed = html.substring(0, 50000);
		contentForClaude = `Extract the recipe from this HTML page and translate everything to French:\n\n${trimmed}`;
	}

	const client = new Anthropic({ apiKey });
	const message = await client.messages.create({
		model: 'claude-sonnet-4-20250514',
		max_tokens: 2000,
		messages: [
			{
				role: 'user',
				content: contentForClaude
			}
		],
		system: EXTRACTION_PROMPT
	});

	// Extract text response
	const text = message.content
		.filter((b): b is Anthropic.TextBlock => b.type === 'text')
		.map((b) => b.text)
		.join('');

	// Parse JSON from response (handle markdown code blocks)
	const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
	try {
		const recipe = JSON.parse(jsonMatch[1]!.trim());
		return json({
			...recipe,
			source_url: url
		});
	} catch {
		error(500, "Impossible d'analyser la recette");
	}
};
