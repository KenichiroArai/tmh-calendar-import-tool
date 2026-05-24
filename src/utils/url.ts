/**
 * URLからIDを返す。
 */
function extractIdFromUrl(url: string): string {
  // ドキュメントIDは "/d/" の後に続く部分で、次のスラッシュ "/" までです。
  const idMatch = url.match(/\/d\/(.+?)\//);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  } else {
    throw new Error("URLからIDを抽出できませんでした: " + url);
  }
}
