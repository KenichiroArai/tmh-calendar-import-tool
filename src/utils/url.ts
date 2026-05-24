/**
 * URLからIDを返す。
 * @param url Google ドキュメント等の URL
 * @return ファイル ID
 */
function extractIdFromUrl(url: string): string {
  const idMatch = url.match(/\/d\/(.+?)\//);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  throw new Error("URLからIDを抽出できませんでした: " + url);
}
