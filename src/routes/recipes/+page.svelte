<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	let searchInput = $state(data.search);
	let searchTimeout: ReturnType<typeof setTimeout>;

	function onSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const params = new URLSearchParams();
			if (searchInput) params.set('q', searchInput);
			if (data.activeTag) params.set('tag', data.activeTag);
			goto(`/recipes${params.toString() ? '?' + params : ''}`, { replaceState: true });
		}, 300);
	}

	function toggleTag(tagName: string) {
		const params = new URLSearchParams();
		if (searchInput) params.set('q', searchInput);
		if (data.activeTag !== tagName) params.set('tag', tagName);
		goto(`/recipes${params.toString() ? '?' + params : ''}`, { replaceState: true });
	}

	function formatTime(minutes: number | null): string {
		if (!minutes) return '';
		if (minutes < 60) return `${minutes} min`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
	}
</script>

<svelte:head>
	<title>Recettes — Chef Gustave</title>
</svelte:head>

<div class="vine"><span>Recettes</span></div>

<div class="search-bar">
	<input
		type="search"
		placeholder="Chercher une recette…"
		bind:value={searchInput}
		oninput={onSearch}
	/>
</div>

{#if data.tags.length > 0}
	<div class="tag-filter">
		{#each data.tags as tag}
			<button
				class="tag"
				class:active={data.activeTag === tag.name}
				onclick={() => toggleTag(tag.name)}
			>
				{tag.name}
			</button>
		{/each}
	</div>
{/if}

{#if data.recipes.length === 0}
	<p class="empty-state">
		{#if data.search || data.activeTag}
			Aucune recette trouvée.
		{:else}
			Aucune recette pour le moment.
		{/if}
	</p>
{:else}
	<div class="recipe-list">
		{#each data.recipes as recipe}
			<a href="/recipes/{recipe.id}" class="card recipe-card">
				<h3>{recipe.name}</h3>
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
					<div class="tags">
						{#each recipe.tags as tag, i}
							<span class="tag" class:warm={i % 3 === 1}>{tag.name}</span>
						{/each}
					</div>
				{/if}
			</a>
		{/each}
	</div>
{/if}

<a href="/recipes/new" class="fab">+</a>

<style>
	.search-bar {
		padding: 0 16px 8px;
	}

	.tag-filter {
		display: flex;
		gap: 6px;
		padding: 0 16px 12px;
		flex-wrap: wrap;
	}

	.tag-filter .tag {
		cursor: pointer;
		transition: all 0.2s;
	}

	.tag-filter .tag.active {
		background: var(--verde);
		color: var(--parchment);
	}

	.recipe-card {
		display: block;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
	}

	.recipe-card h3 {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.15rem;
		margin-bottom: 8px;
		color: var(--ink);
	}

	.empty-state {
		text-align: center;
		color: var(--ink-soft);
		padding: 60px 24px;
		font-style: italic;
		animation: fade-in 0.5s ease both;
	}
</style>
