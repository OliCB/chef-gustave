export function getWeekBounds(offset = 0): { weekStart: string; weekEnd: string } {
	const now = new Date();
	const day = now.getDay();
	const diff = day === 0 ? 6 : day - 1;
	const monday = new Date(now);
	monday.setDate(now.getDate() - diff + offset * 7);
	monday.setHours(0, 0, 0, 0);

	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);

	return {
		weekStart: monday.toISOString().split('T')[0],
		weekEnd: sunday.toISOString().split('T')[0]
	};
}

export function formatWeekLabel(offset: number): string {
	if (offset === 0) return 'Cette semaine';
	if (offset === 1) return 'Semaine prochaine';
	if (offset === -1) return 'Semaine dernière';

	const { weekStart, weekEnd } = getWeekBounds(offset);
	const start = new Date(weekStart + 'T00:00:00');
	const end = new Date(weekEnd + 'T00:00:00');
	const fmt = (d: Date) => d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
	return `${fmt(start)} – ${fmt(end)}`;
}
