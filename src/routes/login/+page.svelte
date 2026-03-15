<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Connexion — Chef Gustave</title>
</svelte:head>

<div class="login-page">
	<header>
		<div class="wordmark">Chef Gustave<span class="dot"></span></div>
		<div class="tagline">le carnet gourmand</div>
	</header>

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}
	>
		<input
			type="password"
			name="password"
			placeholder="Mot de passe"
			required
			autocomplete="current-password"
		/>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<button type="submit" disabled={loading}>
			{loading ? 'Connexion…' : 'Entrer'}
		</button>
	</form>
</div>

<style>
	.login-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 24px;
		animation: fade-in 0.6s ease both;
	}

	header {
		text-align: center;
		margin-bottom: 48px;
	}

	form {
		width: 100%;
		max-width: 300px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	button {
		width: 100%;
		padding: 14px;
		font-size: 1rem;
	}
</style>
