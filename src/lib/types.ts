export interface Ingredient {
	id: string;
	name: string;
}

export interface RecipeIngredient {
	ingredient_id: string;
	name: string;
	quantity: number | null;
	unit: string | null;
	position: number;
}

export interface Step {
	id?: string;
	instruction: string;
	position: number;
}

export interface Tag {
	id: string;
	name: string;
}

export interface Recipe {
	id: string;
	name: string;
	servings: number | null;
	prep_time: number | null;
	cook_time: number | null;
	source_url: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
	ingredients: RecipeIngredient[];
	steps: Step[];
	tags: Tag[];
}

export interface RecipeFormData {
	name: string;
	servings: number | null;
	prep_time: number | null;
	cook_time: number | null;
	source_url: string | null;
	notes: string | null;
	ingredients: {
		name: string;
		quantity: number | null;
		unit: string | null;
	}[];
	steps: string[];
	tags: string[];
}

export interface NutritionInfo {
	recipe_id: string;
	calories: number | null;
	protein: number | null;
	carbs: number | null;
	fat: number | null;
	fiber: number | null;
}

export interface MealPlanEntry {
	id: string;
	date: string;
	meal_type: 'déjeuner' | 'dîner' | 'souper' | 'collation';
	recipe_id: string;
	recipe?: Recipe;
}
