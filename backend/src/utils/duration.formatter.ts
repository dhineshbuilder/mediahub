export function formatDuration(seconds: number | string | undefined | null): string {
  if (seconds === undefined || seconds === null) return '00:00';
  const sec = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (isNaN(sec) || sec < 0) return '00:00';

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);

  const formattedM = m.toString().padStart(2, '0');
  const formattedS = s.toString().padStart(2, '0');

  if (h > 0) {
    const formattedH = h.toString().padStart(2, '0');
    return `${formattedH}:${formattedM}:${formattedS}`;
  }

  return `${formattedM}:${formattedS}`;
}
