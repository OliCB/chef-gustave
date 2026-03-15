<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatWeekLabel } from '$lib/week';

	let { data } = $props();
	let copied = $state(false);

	let weekLabel = $derived(formatWeekLabel(data.weekOffset));

	function navigateWeek(direction: -1 | 1) {
		const newOffset = data.weekOffset + direction;
		const params = newOffset === 0 ? '' : `?week=${newOffset}`;
		goto(`/grocery-list${params}`);
	}

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

<div class="week-nav">
	<button class="week-arrow" onclick={() => navigateWeek(-1)}>←</button>
	<span class="week-label">{weekLabel}</span>
	<button class="week-arrow" onclick={() => navigateWeek(1)}>→</button>
</div>

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
	.week-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 4px 16px 16px;
	}

	.week-arrow {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: rgba(58, 107, 53, 0.08);
		color: var(--verde);
		font-size: 1.1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.week-arrow:hover {
		background: var(--verde);
		color: var(--parchment);
	}

	.week-label {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--ink);
		min-width: 160px;
		text-align: center;
	}

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
