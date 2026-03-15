<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	const MEAL_TYPES = ['déjeuner', 'dîner', 'souper', 'collation'] as const;
	const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

	let pickerOpen = $state(false);
	let pickerDate = $state('');
	let pickerMeal = $state<string>('');
	let searchQuery = $state('');

	// Generate the 7 days of the week
	let days = $derived(() => {
		const result: { date: string; label: string }[] = [];
		const start = new Date(data.weekStart + 'T00:00:00');
		for (let i = 0; i < 7; i++) {
			const d = new Date(start);
			d.setDate(start.getDate() + i);
			result.push({
				date: d.toISOString().split('T')[0],
				label: DAY_NAMES[i]
			});
		}
		return result;
	});

	function getEntry(date: string, mealType: string) {
		return data.entries.find(
			(e: any) => e.date === date && e.meal_type === mealType
		);
	}

	function openPicker(date: string, mealType: string) {
		pickerDate = date;
		pickerMeal = mealType;
		searchQuery = '';
		pickerOpen = true;
	}

	function closePicker() {
		pickerOpen = false;
	}

	let filteredRecipes = $derived(
		data.recipes.filter((r: any) =>
			r.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	async function assignRecipe(recipeId: string) {
		await fetch('/api/meal-plan', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				date: pickerDate,
				meal_type: pickerMeal,
				recipe_id: recipeId
			})
		});
		closePicker();
		invalidateAll();
	}

	async function removeEntry(id: string) {
		await fetch(`/api/meal-plan?id=${id}`, { method: 'DELETE' });
		invalidateAll();
	}
</script>

<svelte:head>
	<title>Plan — Chef Gustave</title>
</svelte:head>

<div class="vine"><span>Plan de la semaine</span></div>

<div class="week-grid">
	{#each days() as day}
		<div class="day-column card">
			<h3 class="day-name">{day.label}</h3>
			<div class="day-date">{new Date(day.date + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</div>

			{#each MEAL_TYPES as mealType}
				{@const entry = getEntry(day.date, mealType)}
				<div class="meal-slot">
					<span class="meal-label">{mealType}</span>
					{#if entry}
						<div class="meal-filled">
							<a href="/recipes/{entry.recipe?.id || entry.recipe_id}" class="meal-recipe">
								{entry.recipe?.name || '…'}
							</a>
							<button class="meal-remove" onclick={() => removeEntry(entry.id)}>×</button>
						</div>
					{:else}
						<button class="meal-empty" onclick={() => openPicker(day.date, mealType)}>
							+
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/each}
</div>

{#if pickerOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="picker-overlay" onclick={closePicker}>
		<div class="picker" onclick={(e) => e.stopPropagation()}>
			<div class="picker-header">
				<h3>Choisir une recette</h3>
				<button class="btn-icon" onclick={closePicker}>×</button>
			</div>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Chercher…"
				class="picker-search"
			/>
			<div class="picker-list">
				{#each filteredRecipes as recipe}
					<button class="picker-item" onclick={() => assignRecipe(recipe.id)}>
						{recipe.name}
					</button>
				{/each}
				{#if filteredRecipes.length === 0}
					<p class="picker-empty">Aucune recette trouvée.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.week-grid {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 0 8px;
	}

	.day-column {
		padding: 14px 16px;
		margin: 4px 0;
	}

	.day-name {
		font-size: 1rem;
		margin-bottom: 2px;
	}

	.day-date {
		font-size: 0.75rem;
		color: var(--ink-soft);
		margin-bottom: 10px;
	}

	.meal-slot {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 0;
		border-bottom: 1px solid var(--sage-pale);
	}

	.meal-slot:last-child {
		border-bottom: none;
	}

	.meal-label {
		font-family: var(--font-display);
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink-soft);
		min-width: 70px;
	}

	.meal-filled {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.meal-recipe {
		flex: 1;
		font-size: 0.85rem;
		color: var(--ink);
		text-decoration: none;
		font-weight: 500;
	}

	.meal-remove {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		font-size: 0.8rem;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(194, 99, 58, 0.1);
		color: var(--terra);
	}

	.meal-empty {
		flex: 1;
		height: 32px;
		border-radius: 8px;
		background: rgba(58, 107, 53, 0.04);
		color: var(--sage);
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed var(--sage-pale);
	}

	.meal-empty:hover {
		background: rgba(58, 107, 53, 0.1);
		color: var(--verde);
	}

	/* Recipe picker modal */
	.picker-overlay {
		position: fixed;
		inset: 0;
		background: rgba(43, 33, 24, 0.4);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px 16px;
	}

	.picker {
		background: var(--parchment);
		width: 100%;
		max-width: 420px;
		max-height: 80vh;
		border-radius: 20px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		animation: picker-in 0.25s ease;
	}

	@keyframes picker-in {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}

	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.picker-header h3 {
		font-size: 1.1rem;
	}

	.picker-header .btn-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: rgba(58, 107, 53, 0.08);
		color: var(--verde);
		font-size: 1rem;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.picker-search {
		margin-bottom: 12px;
	}

	.picker-list {
		overflow-y: auto;
		flex: 1;
	}

	.picker-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 12px 16px;
		background: #fff;
		border-radius: 10px;
		margin-bottom: 6px;
		color: var(--ink);
		font-family: var(--font-body);
		font-size: 0.9rem;
		box-shadow: 0 1px 4px rgba(43, 33, 24, 0.06);
	}

	.picker-item:hover {
		background: rgba(58, 107, 53, 0.06);
	}

	.picker-empty {
		text-align: center;
		color: var(--ink-soft);
		font-style: italic;
		padding: 24px;
	}
</style>
