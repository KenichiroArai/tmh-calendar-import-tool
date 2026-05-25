/**
 * URLからIDを返す。
 */
function extractIdFromUrl(url: string): string {
  let result: string = "";

  const idMatch = url.match(/\/d\/(.+?)\//);
  if (!idMatch || !idMatch[1]) {
    throw new Error("URLからIDを抽出できませんでした: " + url);
  }
  result = idMatch[1];
  return result;
}
