<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="app-shell">
	<div class="content">
		{@render children()}
	</div>

	{#if $page.url.pathname !== '/login'}
		<nav>
			<a href="/recipes" class:active={$page.url.pathname.startsWith('/recipes')}>Recettes</a>
			<a href="/meal-plan" class:active={$page.url.pathname === '/meal-plan'}>Plan</a>
			<a href="/grocery-list" class:active={$page.url.pathname === '/grocery-list'}>Épicerie</a>
		</nav>
	{/if}
</div>

<style>
	.app-shell {
		max-width: 420px;
		margin: 0 auto;
		min-height: 100vh;
		position: relative;
	}

	.content {
		position: relative;
		z-index: 1;
		padding-bottom: 80px;
	}

	nav {
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 420px;
		display: flex;
		justify-content: space-around;
		padding: 10px 0 28px;
		background: linear-gradient(transparent, var(--parchment) 35%);
		z-index: 10;
	}

	nav a {
		text-decoration: none;
		font-family: var(--font-display);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-soft);
		text-align: center;
		padding: 8px 18px;
		border-radius: 10px;
		transition: all 0.25s;
	}

	nav a.active {
		color: var(--verde-deep);
		background: rgba(58, 107, 53, 0.1);
	}
</style>
