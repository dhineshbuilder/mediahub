export function formatBytes(bytes: number | string | undefined | null): string {
  if (bytes === undefined || bytes === null) return 'Unknown Size';
  const parsed = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(parsed) || parsed < 0) return 'Unknown Size';

  if (parsed === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(parsed) / Math.log(k));

  return `${parseFloat((parsed / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
