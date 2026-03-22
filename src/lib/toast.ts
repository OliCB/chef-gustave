import { writable } from 'svelte/store';

export type Toast = { id: number; message: string; type: 'error' | 'success' };

const { subscribe, update } = writable<Toast[]>([]);
let next = 0;

function add(message: string, type: Toast['type'] = 'error', duration = 4000) {
	const id = next++;
	update((t) => [...t, { id, message, type }]);
	setTimeout(() => remove(id), duration);
}

function remove(id: number) {
	update((t) => t.filter((toast) => toast.id !== id));
}

export const toast = { subscribe, error: (m: string) => add(m, 'error'), success: (m: string) => add(m, 'success'), remove };
