<script lang="ts">
	import { toast } from '$lib/toast';
</script>

<div class="toaster">
	{#each $toast as t (t.id)}
		<div class="toast {t.type}" role="alert">
			<span>{t.message}</span>
			<button onclick={() => toast.remove(t.id)}>×</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 32px);
		max-width: 388px;
		z-index: 200;
		display: flex;
		flex-direction: column;
		gap: 8px;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 0.9rem;
		font-family: var(--font-body);
		pointer-events: all;
		animation: slide-in 0.25s ease both;
		box-shadow: 0 4px 16px rgba(43, 33, 24, 0.15);
	}

	@keyframes slide-in {
		from { opacity: 0; transform: translateY(-8px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.toast.error {
		background: var(--terra);
		color: var(--parchment);
	}

	.toast.success {
		background: var(--verde);
		color: var(--parchment);
	}

	.toast button {
		background: none;
		color: inherit;
		opacity: 0.7;
		font-size: 1.1rem;
		padding: 0;
		line-height: 1;
		flex-shrink: 0;
	}

	.toast button:hover {
		opacity: 1;
	}
</style>
