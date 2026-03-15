<script lang="ts">
	let { data } = $props();
	let copied = $state(false);

	function formatItem(item: { name: string; quantity: number | null; unit: string | null }): string {
		const parts: string[] = [];
		if (item.quantity !== null) {
			// Format quantity: remove trailing zeros
			const qty = Number(item.quantity);
			parts.push(qty % 1 === 0 ? qty.toString() : qty.toFixed(1));
		}
		if (item.unit) parts.push(item.unit);
		parts.push(item.name);
		return parts.join(' ');
	}

	async function copyToClipboard() {
		const text = data.items.map(formatItem).join('\n');
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Fallback
			const textarea = document.createElement('textarea');
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<svelte:head>
	<title>Épicerie — Chef Gustave</title>
</svelte:head>

<div class="vine"><span>Liste d'épicerie</span></div>

{#if data.items.length === 0}
	<p class="empty-state">
		Aucun ingrédient — ajoutez des recettes au plan de la semaine.
	</p>
{:else}
	<div class="grocery-header">
		<span class="item-count">{data.items.length} ingrédient{data.items.length > 1 ? 's' : ''}</span>
		<button class="btn-secondary copy-btn" onclick={copyToClipboard}>
			{copied ? '✓ Copié' : 'Copier'}
		</button>
	</div>

	<ul class="grocery-list">
		{#each data.items as item}
			<li class="grocery-item">
				<span class="item-qty">
					{#if item.quantity !== null}
						{Number(item.quantity) % 1 === 0 ? Number(item.quantity) : Number(item.quantity).toFixed(1)}
					{/if}
					{#if item.unit}
						{item.unit}
					{/if}
				</span>
				<span class="item-name">{item.name}</span>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.empty-state {
		text-align: center;
		color: var(--ink-soft);
		padding: 60px 24px;
		font-style: italic;
		animation: fade-in 0.5s ease both;
	}

	.grocery-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 20px 12px;
	}

	.item-count {
		font-family: var(--font-display);
		font-size: 0.8rem;
		color: var(--ink-soft);
		font-weight: 600;
	}

	.copy-btn {
		font-size: 0.8rem;
		padding: 8px 16px;
	}

	.grocery-list {
		list-style: none;
		padding: 0 16px;
	}

	.grocery-item {
		display: flex;
		gap: 8px;
		padding: 12px 8px;
		border-bottom: 1px solid var(--sage-pale);
		animation: fade-in 0.4s ease both;
	}

	.grocery-item:nth-child(2) { animation-delay: 0.03s; }
	.grocery-item:nth-child(3) { animation-delay: 0.06s; }
	.grocery-item:nth-child(4) { animation-delay: 0.09s; }
	.grocery-item:nth-child(5) { animation-delay: 0.12s; }

	.grocery-item:last-child {
		border-bottom: none;
	}

	.item-qty {
		font-family: var(--font-display);
		font-weight: 600;
		color: var(--verde);
		min-width: 80px;
		font-size: 0.95rem;
	}

	.item-name {
		font-size: 1rem;
	}
</style>
