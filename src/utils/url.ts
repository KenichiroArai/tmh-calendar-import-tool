/**
 * URLからIDを返す。
 */
export function extractIdFromUrl(url: string): string {
  const idMatch = url.match(/\/d\/(.+?)\//);
  if (!idMatch || !idMatch[1]) {
    throw new Error("URLからIDを抽出できませんでした: " + url);
  }
  const result = idMatch[1];
  return result;
}
