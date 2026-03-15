<script lang="ts">
	import { goto } from '$app/navigation';
	import type { RecipeFormData, Recipe } from '$lib/types';

	let {
		recipe = undefined,
		allTags = []
	}: {
		recipe?: Partial<Recipe>;
		allTags: { id: string; name: string }[];
	} = $props();

	// Form state
	let name = $state(recipe?.name || '');
	let servings = $state<number | null>(recipe?.servings ?? null);
	let prepTime = $state<number | null>(recipe?.prep_time ?? null);
	let cookTime = $state<number | null>(recipe?.cook_time ?? null);
	let sourceUrl = $state(recipe?.source_url || '');
	let notes = $state(recipe?.notes || '');

	let ingredients = $state(
		recipe?.ingredients?.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })) || [
			{ name: '', quantity: null as number | null, unit: '' }
		]
	);

	let steps = $state(recipe?.steps?.map((s) => s.instruction) || ['']);

	let tags = $state<string[]>(recipe?.tags?.map((t) => t.name) || []);
	let tagInput = $state('');

	let saving = $state(false);

	// Tag autocomplete
	let tagSuggestions = $derived(
		tagInput.length > 0
			? allTags
					.filter(
						(t) =>
							t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
							!tags.includes(t.name)
					)
					.slice(0, 5)
			: []
	);

	function addIngredient() {
		ingredients = [...ingredients, { name: '', quantity: null, unit: '' }];
	}

	function removeIngredient(index: number) {
		ingredients = ingredients.filter((_, i) => i !== index);
	}

	function moveIngredient(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= ingredients.length) return;
		const copy = [...ingredients];
		[copy[index], copy[target]] = [copy[target], copy[index]];
		ingredients = copy;
	}

	function addStep() {
		steps = [...steps, ''];
	}

	function removeStep(index: number) {
		steps = steps.filter((_, i) => i !== index);
	}

	function moveStep(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= steps.length) return;
		const copy = [...steps];
		[copy[index], copy[target]] = [copy[target], copy[index]];
		steps = copy;
	}

	function addTag(name: string) {
		const normalized = name.trim().toLowerCase();
		if (normalized && !tags.includes(normalized)) {
			tags = [...tags, normalized];
		}
		tagInput = '';
	}

	function removeTag(name: string) {
		tags = tags.filter((t) => t !== name);
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (tagSuggestions.length > 0) {
				addTag(tagSuggestions[0].name);
			} else if (tagInput.trim()) {
				addTag(tagInput);
			}
		}
	}

	async function handleSubmit() {
		if (!name.trim()) return;
		saving = true;

		const body: RecipeFormData = {
			name: name.trim(),
			servings: servings || null,
			prep_time: prepTime || null,
			cook_time: cookTime || null,
			source_url: sourceUrl.trim() || null,
			notes: notes.trim() || null,
			ingredients: ingredients
				.filter((i) => i.name.trim())
				.map((i) => ({
					name: i.name.trim(),
					quantity: i.quantity || null,
					unit: i.unit?.trim() || null
				})),
			steps: steps.filter((s) => s.trim()),
			tags
		};

		const url = recipe?.id ? `/api/recipes/${recipe.id}` : '/api/recipes';
		const method = recipe?.id ? 'PUT' : 'POST';

		const res = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (res.ok) {
			const data = await res.json();
			goto(`/recipes/${recipe?.id || data.id}`);
		} else {
			saving = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="recipe-form">
	<div class="form-group">
		<label for="name">Nom de la recette</label>
		<input id="name" type="text" bind:value={name} required placeholder="Ex: Poulet rôti au citron" />
	</div>

	<div class="form-row">
		<div class="form-group">
			<label for="servings">Portions</label>
			<input id="servings" type="number" bind:value={servings} min="1" placeholder="2" />
		</div>
		<div class="form-group">
			<label for="prep">Préparation (min)</label>
			<input id="prep" type="number" bind:value={prepTime} min="0" placeholder="20" />
		</div>
		<div class="form-group">
			<label for="cook">Cuisson (min)</label>
			<input id="cook" type="number" bind:value={cookTime} min="0" placeholder="45" />
		</div>
	</div>

	<div class="vine"><span>Ingrédients</span></div>

	{#each ingredients as ing, i}
		<div class="ingredient-row">
			<input
				type="number"
				bind:value={ing.quantity}
				placeholder="Qté"
				step="any"
				class="qty-input"
			/>
			<input
				type="text"
				bind:value={ing.unit}
				placeholder="Unité"
				class="unit-input"
			/>
			<input
				type="text"
				bind:value={ing.name}
				placeholder="Ingrédient"
				class="name-input"
			/>
			<div class="row-actions">
				<button type="button" onclick={() => moveIngredient(i, -1)} disabled={i === 0} class="btn-mini">↑</button>
				<button type="button" onclick={() => moveIngredient(i, 1)} disabled={i === ingredients.length - 1} class="btn-mini">↓</button>
				<button type="button" onclick={() => removeIngredient(i)} class="btn-mini danger">×</button>
			</div>
		</div>
	{/each}
	<button type="button" class="btn-secondary add-btn" onclick={addIngredient}>+ Ingrédient</button>

	<div class="vine"><span>Étapes</span></div>

	{#each steps as step, i}
		<div class="step-row">
			<span class="step-number">{i + 1}</span>
			<textarea
				bind:value={steps[i]}
				placeholder="Décrivez l'étape…"
				rows="2"
			></textarea>
			<div class="row-actions">
				<button type="button" onclick={() => moveStep(i, -1)} disabled={i === 0} class="btn-mini">↑</button>
				<button type="button" onclick={() => moveStep(i, 1)} disabled={i === steps.length - 1} class="btn-mini">↓</button>
				<button type="button" onclick={() => removeStep(i)} class="btn-mini danger">×</button>
			</div>
		</div>
	{/each}
	<button type="button" class="btn-secondary add-btn" onclick={addStep}>+ Étape</button>

	<div class="vine"><span>Tags</span></div>

	<div class="tags-section">
		{#if tags.length > 0}
			<div class="tags">
				{#each tags as tag}
					<button type="button" class="tag" onclick={() => removeTag(tag)}>
						{tag} ×
					</button>
				{/each}
			</div>
		{/if}
		<div class="tag-input-wrap">
			<input
				type="text"
				bind:value={tagInput}
				onkeydown={handleTagKeydown}
				placeholder="Ajouter un tag…"
			/>
			{#if tagSuggestions.length > 0}
				<div class="tag-suggestions">
					{#each tagSuggestions as suggestion}
						<button type="button" onclick={() => addTag(suggestion.name)}>
							{suggestion.name}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="form-group">
		<label for="source">URL source</label>
		<input id="source" type="url" bind:value={sourceUrl} placeholder="https://..." />
	</div>

	<div class="form-group">
		<label for="notes">Notes</label>
		<textarea id="notes" bind:value={notes} placeholder="Notes personnelles…" rows="3"></textarea>
	</div>

	<button type="submit" disabled={saving || !name.trim()}>
		{saving ? 'Enregistrement…' : 'Enregistrer'}
	</button>
</form>

<style>
	.recipe-form {
		padding: 0 16px 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 8px;
	}

	.form-row input {
		font-size: 0.9rem;
		padding: 10px 12px;
	}

	.ingredient-row,
	.step-row {
		display: flex;
		gap: 6px;
		align-items: flex-start;
	}

	.qty-input {
		width: 60px;
		flex-shrink: 0;
		font-size: 0.9rem;
		padding: 10px 8px;
	}

	.unit-input {
		width: 70px;
		flex-shrink: 0;
		font-size: 0.9rem;
		padding: 10px 8px;
	}

	.name-input {
		flex: 1;
		font-size: 0.9rem;
		padding: 10px 8px;
	}

	.step-number {
		font-family: var(--font-display);
		font-weight: 600;
		color: var(--verde);
		font-size: 1.1rem;
		min-width: 24px;
		padding-top: 10px;
	}

	.step-row textarea {
		flex: 1;
		min-height: 60px;
		font-size: 0.9rem;
	}

	.row-actions {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex-shrink: 0;
	}

	.btn-mini {
		width: 28px;
		height: 24px;
		font-size: 0.75rem;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		background: rgba(58, 107, 53, 0.08);
		color: var(--verde);
	}

	.btn-mini.danger {
		background: rgba(194, 99, 58, 0.1);
		color: var(--terra);
	}

	.btn-mini:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.add-btn {
		align-self: flex-start;
		font-size: 0.8rem;
		padding: 8px 16px;
	}

	.tags-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tag-input-wrap {
		position: relative;
	}

	.tag-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #fff;
		border: 2px solid var(--sage-pale);
		border-top: none;
		border-radius: 0 0 10px 10px;
		z-index: 5;
		overflow: hidden;
	}

	.tag-suggestions button {
		display: block;
		width: 100%;
		text-align: left;
		padding: 10px 16px;
		background: none;
		color: var(--ink);
		font-family: var(--font-body);
		font-size: 0.9rem;
		border-radius: 0;
	}

	.tag-suggestions button:hover {
		background: rgba(58, 107, 53, 0.06);
	}

	.tags .tag {
		cursor: pointer;
	}

	button[type='submit'] {
		margin-top: 8px;
		width: 100%;
		padding: 14px;
		font-size: 1rem;
	}
</style>
