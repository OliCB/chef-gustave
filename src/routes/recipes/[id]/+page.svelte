<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
	let recipe = $derived(data.recipe);
	let nutrition = $state(data.nutrition);
	let nutritionLoading = $state(false);
	let wakeLock: WakeLockSentinel | null = $state(null);
	let wakeLockActive = $state(false);

	async function fetchNutrition() {
		nutritionLoading = true;
		try {
			const res = await fetch('/api/nutrition', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recipe_id: recipe.id })
			});
			if (res.ok) {
				nutrition = await res.json();
			}
		} finally {
			nutritionLoading = false;
		}
	}

	function formatTime(minutes: number | null): string {
		if (!minutes) return '';
		if (minutes < 60) return `${minutes} min`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
	}

	async function toggleWakeLock() {
		if (wakeLock) {
			await wakeLock.release();
			wakeLock = null;
			wakeLockActive = false;
		} else {
			try {
				wakeLock = await navigator.wakeLock.request('screen');
				wakeLockActive = true;
				wakeLock.addEventListener('release', () => {
					wakeLockActive = false;
					wakeLock = null;
				});
			} catch {
				// Wake Lock not supported or denied
			}
		}
	}

	async function handleDelete() {
		if (!confirm('Supprimer cette recette ?')) return;
		await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' });
		goto('/recipes');
	}
</script>

<svelte:head>
	<title>{recipe.name} — Chef Gustave</title>
</svelte:head>

<div class="recipe-view">
	<div class="recipe-header">
		<a href="/recipes" class="back-link">← Recettes</a>
		<div class="header-actions">
			<button class="btn-icon" class:active={wakeLockActive} onclick={toggleWakeLock} title="Mode cuisine">
				{wakeLockActive ? '☀' : '☾'}
			</button>
			<a href="/recipes/{recipe.id}/edit" class="btn-icon" title="Modifier">✎</a>
		</div>
	</div>

	<h1>{recipe.name}</h1>

	<div class="recipe-meta">
		{#if recipe.prep_time}
			<span>{formatTime(recipe.prep_time)} prep</span>
		{/if}
		{#if recipe.cook_time}
			<span>{formatTime(recipe.cook_time)} cuisson</span>
		{/if}
		{#if recipe.servings}
			<span>{recipe.servings} portions</span>
		{/if}
	</div>

	{#if recipe.tags.length > 0}
		<div class="tags" style="padding: 0 0 16px;">
			{#each recipe.tags as tag, i}
				<span class="tag" class:warm={i % 3 === 1}>{tag.name}</span>
			{/each}
		</div>
	{/if}

	{#if recipe.ingredients.length > 0}
		<div class="vine"><span>Ingrédients</span></div>
		<ul class="ingredients-list">
			{#each recipe.ingredients as ing}
				<li>
					{#if ing.quantity}{ing.quantity}{/if}
					{#if ing.unit}{ing.unit}{/if}
					{ing.name}
				</li>
			{/each}
		</ul>
	{/if}

	{#if recipe.steps.length > 0}
		<div class="vine"><span>Étapes</span></div>
		<ol class="steps-list">
			{#each recipe.steps as step}
				<li>{step.instruction}</li>
			{/each}
		</ol>
	{/if}

	{#if recipe.notes}
		<div class="vine"><span>Notes</span></div>
		<p class="notes">{recipe.notes}</p>
	{/if}

	<div class="vine"><span>Nutrition</span></div>
	{#if nutrition}
		<div class="nutrition-grid">
			<div class="nutrition-item">
				<span class="nutrition-value">{nutrition.calories ?? '—'}</span>
				<span class="nutrition-label">kcal</span>
			</div>
			<div class="nutrition-item">
				<span class="nutrition-value">{nutrition.protein ?? '—'}</span>
				<span class="nutrition-label">protéines (g)</span>
			</div>
			<div class="nutrition-item">
				<span class="nutrition-value">{nutrition.carbs ?? '—'}</span>
				<span class="nutrition-label">glucides (g)</span>
			</div>
			<div class="nutrition-item">
				<span class="nutrition-value">{nutrition.fat ?? '—'}</span>
				<span class="nutrition-label">lipides (g)</span>
			</div>
			<div class="nutrition-item">
				<span class="nutrition-value">{nutrition.fiber ?? '—'}</span>
				<span class="nutrition-label">fibres (g)</span>
			</div>
		</div>
		<p class="nutrition-note">Par portion</p>
	{:else}
		<div class="nutrition-fetch">
			<button class="btn-secondary" onclick={fetchNutrition} disabled={nutritionLoading}>
				{nutritionLoading ? 'Chargement…' : 'Obtenir les informations nutritionnelles'}
			</button>
		</div>
	{/if}

	{#if recipe.source_url}
		<div class="source">
			<a href={recipe.source_url} target="_blank" rel="noopener">Voir la recette originale ↗</a>
		</div>
	{/if}

	<div class="delete-section">
		<button class="delete-btn" onclick={handleDelete}>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
			Supprimer
		</button>
	</div>
</div>

<style>
	.recipe-view {
		padding: 16px;
		animation: fade-in 0.4s ease both;
	}

	.recipe-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.back-link {
		font-family: var(--font-display);
		font-size: 0.85rem;
		color: var(--verde);
		text-decoration: none;
		font-weight: 600;
	}

	.header-actions {
		display: flex;
		gap: 8px;
	}

	.btn-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(58, 107, 53, 0.08);
		color: var(--verde);
		font-size: 1rem;
		padding: 0;
		text-decoration: none;
	}

	.btn-icon.active {
		background: var(--verde);
		color: var(--parchment);
	}

	.btn-icon.danger {
		background: rgba(194, 99, 58, 0.1);
		color: var(--terra);
	}

	h1 {
		font-size: 1.6rem;
		margin-bottom: 12px;
	}

	.ingredients-list {
		list-style: none;
		padding: 8px 24px;
	}

	.ingredients-list li {
		padding: 8px 0;
		border-bottom: 1px solid var(--sage-pale);
		font-size: 1.05rem;
	}

	.ingredients-list li:last-child {
		border-bottom: none;
	}

	.steps-list {
		padding: 8px 24px 8px 40px;
	}

	.steps-list li {
		padding: 12px 0;
		font-size: 1.05rem;
		line-height: 1.6;
		border-bottom: 1px solid var(--sage-pale);
	}

	.steps-list li:last-child {
		border-bottom: none;
	}

	.notes {
		padding: 8px 24px;
		color: var(--ink-soft);
		font-style: italic;
		line-height: 1.6;
	}

	.source {
		padding: 16px 24px;
		text-align: center;
	}

	.source a {
		color: var(--verde);
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.nutrition-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 8px;
		padding: 12px 16px;
	}

	.nutrition-item {
		text-align: center;
		padding: 10px 4px;
		background: #fff;
		border-radius: 10px;
		box-shadow: 0 1px 4px rgba(43, 33, 24, 0.06);
	}

	.nutrition-value {
		display: block;
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.1rem;
		color: var(--verde-deep);
	}

	.nutrition-label {
		display: block;
		font-size: 0.65rem;
		color: var(--ink-soft);
		margin-top: 2px;
	}

	.nutrition-note {
		text-align: center;
		font-size: 0.75rem;
		color: var(--ink-soft);
		font-style: italic;
		padding: 4px 0 12px;
	}

	.nutrition-fetch {
		padding: 12px 24px;
		text-align: center;
	}

	.delete-section {
		padding: 32px 24px 16px;
	}

	.delete-btn {
		width: 100%;
		padding: 14px;
		font-size: 1rem;
		background: var(--terra);
		color: var(--parchment);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.delete-btn:hover {
		background: #a8502a;
	}
</style>
