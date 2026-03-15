<script lang="ts">
	import RecipeForm from '$lib/components/RecipeForm.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Modifier — {data.recipe.name} — Chef Gustave</title>
</svelte:head>

<div class="page-header">
	<a href="/recipes/{data.recipe.id}" class="back-link">← {data.recipe.name}</a>
</div>

<div class="vine"><span>Modifier la recette</span></div>

<RecipeForm recipe={data.recipe} allTags={data.allTags} />

<style>
	.page-header {
		padding: 16px 16px 0;
	}

	.back-link {
		font-family: var(--font-display);
		font-size: 0.85rem;
		color: var(--verde);
		text-decoration: none;
		font-weight: 600;
	}
</style>
