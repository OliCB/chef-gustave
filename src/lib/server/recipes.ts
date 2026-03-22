import { getDb } from './supabase';
import type { Recipe, RecipeFormData } from '$lib/types';

export async function listRecipes(search?: string, tag?: string): Promise<Recipe[]> {
	const db = getDb();

	let query = db
		.from('recipes')
		.select('*')
		.order('updated_at', { ascending: false });

	if (search) {
		query = query.ilike('name', `%${search}%`);
	}

	const { data: recipes, error } = await query;
	if (error) throw error;
	if (!recipes?.length) return [];

	const ids = recipes.map((r) => r.id);

	// Fetch ingredients, steps, tags in parallel
	const [ingredientsRes, stepsRes, tagsRes] = await Promise.all([
		db
			.from('recipe_ingredients')
			.select('recipe_id, ingredient_id, quantity, unit, position, ingredients(name)')
			.in('recipe_id', ids)
			.order('position'),
		db
			.from('steps')
			.select('*')
			.in('recipe_id', ids)
			.order('position'),
		db
			.from('recipe_tags')
			.select('recipe_id, tag_id, tags(id, name)')
			.in('recipe_id', ids)
	]);

	if (ingredientsRes.error) throw ingredientsRes.error;
	if (stepsRes.error) throw stepsRes.error;
	if (tagsRes.error) throw tagsRes.error;

	const result: Recipe[] = recipes.map((r) => ({
		...r,
		ingredients: (ingredientsRes.data || [])
			.filter((i: any) => i.recipe_id === r.id)
			.map((i: any) => ({
				ingredient_id: i.ingredient_id,
				name: (i.ingredients as any)?.name || '',
				quantity: i.quantity,
				unit: i.unit,
				position: i.position
			})),
		steps: (stepsRes.data || [])
			.filter((s: any) => s.recipe_id === r.id)
			.map((s: any) => ({
				id: s.id,
				instruction: s.instruction,
				position: s.position
			})),
		tags: (tagsRes.data || [])
			.filter((t: any) => t.recipe_id === r.id)
			.map((t: any) => ({
				id: (t.tags as any)?.id || t.tag_id,
				name: (t.tags as any)?.name || ''
			}))
	}));

	// Filter by tag if specified
	if (tag) {
		return result.filter((r) => r.tags.some((t) => t.name === tag));
	}

	return result;
}

export async function getRecipe(id: string): Promise<Recipe | null> {
	const db = getDb();

	const { data: recipe, error } = await db
		.from('recipes')
		.select('*')
		.eq('id', id)
		.single();

	if (error || !recipe) return null;

	const [ingredientsRes, stepsRes, tagsRes] = await Promise.all([
		db
			.from('recipe_ingredients')
			.select('recipe_id, ingredient_id, quantity, unit, position, ingredients(name)')
			.eq('recipe_id', id)
			.order('position'),
		db
			.from('steps')
			.select('*')
			.eq('recipe_id', id)
			.order('position'),
		db
			.from('recipe_tags')
			.select('recipe_id, tag_id, tags(id, name)')
			.eq('recipe_id', id)
	]);

	return {
		...recipe,
		ingredients: (ingredientsRes.data || []).map((i: any) => ({
			ingredient_id: i.ingredient_id,
			name: (i.ingredients as any)?.name || '',
			quantity: i.quantity,
			unit: i.unit,
			position: i.position
		})),
		steps: (stepsRes.data || []).map((s: any) => ({
			id: s.id,
			instruction: s.instruction,
			position: s.position
		})),
		tags: (tagsRes.data || []).map((t: any) => ({
			id: (t.tags as any)?.id || t.tag_id,
			name: (t.tags as any)?.name || ''
		}))
	};
}

async function getOrCreateIngredient(name: string): Promise<string> {
	const db = getDb();
	const normalized = name.trim().toLowerCase();

	// Try to find existing
	const { data: existing } = await db
		.from('ingredients')
		.select('id')
		.eq('name', normalized)
		.single();

	if (existing) return existing.id;

	// Create new — on conflict (race condition), just select again
	const { data: created, error } = await db
		.from('ingredients')
		.upsert({ name: normalized }, { onConflict: 'name' })
		.select('id')
		.single();

	if (error) throw error;
	return created!.id;
}

async function getOrCreateTag(name: string): Promise<string> {
	const db = getDb();
	const normalized = name.trim().toLowerCase();

	const { data: existing } = await db
		.from('tags')
		.select('id')
		.eq('name', normalized)
		.single();

	if (existing) return existing.id;

	const { data: created, error } = await db
		.from('tags')
		.insert({ name: normalized })
		.select('id')
		.single();

	if (error) throw error;
	return created!.id;
}

export async function createRecipe(form: RecipeFormData): Promise<string> {
	const db = getDb();

	// Insert recipe
	const { data: recipe, error: recipeError } = await db
		.from('recipes')
		.insert({
			name: form.name,
			servings: form.servings,
			prep_time: form.prep_time,
			cook_time: form.cook_time,
			source_url: form.source_url,
			notes: form.notes
		})
		.select('id')
		.single();

	if (recipeError) throw recipeError;
	const recipeId = recipe!.id;

	// Insert ingredients
	if (form.ingredients.length > 0) {
		const ingredientRows = await Promise.all(
			form.ingredients.map(async (ing, i) => {
				const ingredientId = await getOrCreateIngredient(ing.name);
				return {
					recipe_id: recipeId,
					ingredient_id: ingredientId,
					quantity: ing.quantity,
					unit: ing.unit,
					position: i
				};
			})
		);
		const { error } = await db.from('recipe_ingredients').insert(ingredientRows);
		if (error) throw error;
	}

	// Insert steps
	if (form.steps.length > 0) {
		const stepRows = form.steps.map((instruction, i) => ({
			recipe_id: recipeId,
			instruction,
			position: i
		}));
		const { error } = await db.from('steps').insert(stepRows);
		if (error) throw error;
	}

	// Insert tags
	if (form.tags.length > 0) {
		const tagRows = await Promise.all(
			form.tags.map(async (name) => {
				const tagId = await getOrCreateTag(name);
				return { recipe_id: recipeId, tag_id: tagId };
			})
		);
		const { error } = await db.from('recipe_tags').insert(tagRows);
		if (error) throw error;
	}

	return recipeId;
}

export async function updateRecipe(id: string, form: RecipeFormData): Promise<void> {
	const db = getDb();

	// Update recipe
	const { error: recipeError } = await db
		.from('recipes')
		.update({
			name: form.name,
			servings: form.servings,
			prep_time: form.prep_time,
			cook_time: form.cook_time,
			source_url: form.source_url,
			notes: form.notes
		})
		.eq('id', id);

	if (recipeError) throw recipeError;

	// Replace ingredients: delete all, re-insert
	await db.from('recipe_ingredients').delete().eq('recipe_id', id);
	if (form.ingredients.length > 0) {
		const ingredientRows = await Promise.all(
			form.ingredients.map(async (ing, i) => {
				const ingredientId = await getOrCreateIngredient(ing.name);
				return {
					recipe_id: id,
					ingredient_id: ingredientId,
					quantity: ing.quantity,
					unit: ing.unit,
					position: i
				};
			})
		);
		const { error } = await db.from('recipe_ingredients').insert(ingredientRows);
		if (error) throw error;
	}

	// Replace steps
	await db.from('steps').delete().eq('recipe_id', id);
	if (form.steps.length > 0) {
		const stepRows = form.steps.map((instruction, i) => ({
			recipe_id: id,
			instruction,
			position: i
		}));
		const { error } = await db.from('steps').insert(stepRows);
		if (error) throw error;
	}

	// Replace tags
	await db.from('recipe_tags').delete().eq('recipe_id', id);
	if (form.tags.length > 0) {
		const tagRows = await Promise.all(
			form.tags.map(async (name) => {
				const tagId = await getOrCreateTag(name);
				return { recipe_id: id, tag_id: tagId };
			})
		);
		const { error } = await db.from('recipe_tags').insert(tagRows);
		if (error) throw error;
	}
}

export async function deleteRecipe(id: string): Promise<void> {
	const db = getDb();
	const { error } = await db.from('recipes').delete().eq('id', id);
	if (error) throw error;
}
