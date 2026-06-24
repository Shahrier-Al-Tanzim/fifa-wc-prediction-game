export function getAnonName(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const num = Math.abs(hash) % 10000;
  return `Predictor #${num}`;
}
