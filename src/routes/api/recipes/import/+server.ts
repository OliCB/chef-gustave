import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';

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
  "notes": "string or null"
}`;

function extractJsonLd(html: string): Record<string, any> | null {
	const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
	let match;
	while ((match = regex.exec(html)) !== null) {
		try {
			const data = JSON.parse(match[1]);
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

/** Parse ISO 8601 duration (e.g. "PT1H20M", "PT45M") to minutes */
function parseDuration(iso: string | undefined | null): number | null {
	if (!iso || typeof iso !== 'string') return null;
	const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
	if (!match) return null;
	return (parseInt(match[1] || '0', 10) * 60) + parseInt(match[2] || '0', 10) || null;
}

/** Parse servings from recipeYield (e.g. "4", "4 servings", ["4"]) */
function parseServings(yield_: any): number | null {
	if (!yield_) return null;
	const str = Array.isArray(yield_) ? yield_[0] : String(yield_);
	const match = str.match(/(\d+)/);
	return match ? parseInt(match[1], 10) : null;
}

/** Strip JSON-LD to only the fields we need for AI processing */
function stripJsonLd(jsonLd: Record<string, any>) {
	return {
		name: jsonLd.name,
		recipeIngredient: jsonLd.recipeIngredient,
		recipeInstructions: jsonLd.recipeInstructions
	};
}

async function fetchHtml(url: string): Promise<string> {
	try {
		const res = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; ChefGustave/1.0)',
				Accept: 'text/html'
			}
		});
		if (!res.ok) error(400, `Impossible de récupérer la page (${res.status})`);
		return await res.text();
	} catch (e: any) {
		if (e.status) throw e;
		error(400, 'Impossible de récupérer la page');
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const { url } = await request.json();
	if (!url || typeof url !== 'string') {
		error(400, 'URL requise');
	}

	const html = await fetchHtml(url);
	const jsonLd = extractJsonLd(html);

	// Extract what we can algorithmically from JSON-LD
	const prepTime = jsonLd ? parseDuration(jsonLd.prepTime) : null;
	const cookTime = jsonLd ? parseDuration(jsonLd.cookTime) : null;
	const servings = jsonLd ? parseServings(jsonLd.recipeYield) : null;

	let userMessage: string;
	if (jsonLd) {
		const stripped = stripJsonLd(jsonLd);
		userMessage = `Here is structured recipe data (JSON-LD) extracted from a web page. Parse the ingredients into structured fields and translate everything to French:\n\n${JSON.stringify(stripped, null, 2)}`;
	} else {
		const trimmed = html.substring(0, 50000);
		userMessage = `Extract the recipe from this HTML page and translate everything to French:\n\n${trimmed}`;
	}

	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) {
		error(500, 'Clé API Gemini manquante');
	}

	const ai = new GoogleGenAI({ apiKey });
	const response = await ai.models.generateContent({
		model: 'gemini-2.5-flash',
		contents: `${EXTRACTION_PROMPT}\n\n${userMessage}`,
		config: {
			responseMimeType: 'application/json'
		}
	});

	const text = response.text ?? '';

	const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
	try {
		const recipe = JSON.parse(jsonMatch[1]!.trim());

		// Override with algorithmically parsed values when available from JSON-LD
		if (prepTime !== null) recipe.prep_time = prepTime;
		if (cookTime !== null) recipe.cook_time = cookTime;
		if (servings !== null) recipe.servings = servings;

		return json({
			...recipe,
			tags: [],
			source_url: url
		});
	} catch {
		error(500, "Impossible d'analyser la recette");
	}
};
