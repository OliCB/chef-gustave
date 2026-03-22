<script lang="ts">
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import { toast } from '$lib/toast';
	import type { Recipe } from '$lib/types';

	let { data } = $props();

	let mode = $state<'manual' | 'import'>('manual');
	let importUrl = $state('');
	let importing = $state(false);
	let importedRecipe = $state<Partial<Recipe> | null>(null);

	function parseImportResponse(recipe: any): Partial<Recipe> {
		return {
			name: recipe.name,
			servings: recipe.servings,
			prep_time: recipe.prep_time,
			cook_time: recipe.cook_time,
			source_url: recipe.source_url,
			notes: recipe.notes,
			ingredients: recipe.ingredients?.map((i: any, idx: number) => ({
				ingredient_id: '',
				name: i.name,
				quantity: i.quantity,
				unit: i.unit,
				position: idx
			})) || [],
			steps: recipe.steps?.map((s: string, idx: number) => ({
				instruction: s,
				position: idx
			})) || [],
			tags: recipe.tags?.map((t: string) => ({
				id: '',
				name: t
			})) || []
		};
	}

	async function runImport(body: object) {
		importing = true;
		try {
			const res = await fetch('/api/recipes/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				toast.error(data.message || "Erreur lors de l'importation");
				return;
			}
			importedRecipe = parseImportResponse(await res.json());
			mode = 'manual';
		} catch {
			toast.error("Erreur lors de l'importation");
		} finally {
			importing = false;
		}
	}

	function handleImport() {
		if (!importUrl.trim()) return;
		runImport({ url: importUrl });
	}
</script>

<svelte:head>
	<title>Nouvelle recette — Chef Gustave</title>
</svelte:head>

<div class="page-header">
	<a href="/recipes" class="back-link">← Recettes</a>
</div>

<div class="mode-toggle">
	<button class:active={mode === 'manual'} onclick={() => (mode = 'manual')}>Saisie manuelle</button>
	<button class:active={mode === 'import'} onclick={() => (mode = 'import')}>Importer une URL</button>
</div>

{#if mode === 'import'}
	<div class="import-section">
		<div class="vine"><span>Importer une URL</span></div>
		<div class="import-form">
			<input
				type="url"
				bind:value={importUrl}
				placeholder="https://www.example.com/recette..."
				disabled={importing}
			/>
			<button
				class="btn-primary"
				onclick={handleImport}
				disabled={importing || !importUrl.trim()}
			>
				{importing ? 'Importation…' : 'Importer'}
			</button>
		</div>
		{#if importing}
			<p class="importing-msg">Analyse de la recette en cours…</p>
		{/if}
	</div>
{:else}
	<div class="vine"><span>Nouvelle recette</span></div>
	<RecipeForm recipe={importedRecipe ? importedRecipe : undefined} allTags={data.allTags} />
{/if}

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

	.mode-toggle {
		display: flex;
		margin: 16px 16px 0;
		border-radius: 10px;
		overflow: hidden;
		border: 2px solid var(--sage-pale);
	}

	.mode-toggle button {
		flex: 1;
		padding: 10px;
		font-size: 0.8rem;
		background: transparent;
		color: var(--ink-soft);
		border-radius: 0;
	}

	.mode-toggle button.active {
		background: var(--verde);
		color: var(--parchment);
	}

	.import-section {
		animation: fade-in 0.3s ease both;
	}

	.import-form {
		padding: 0 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.import-form .btn-primary {
		width: 100%;
		padding: 14px;
	}

	.importing-msg {
		text-align: center;
		color: var(--ink-soft);
		font-style: italic;
		padding: 24px;
		animation: fade-in 0.3s ease both;
	}

	.error {
		padding: 8px 16px;
	}
</style>
