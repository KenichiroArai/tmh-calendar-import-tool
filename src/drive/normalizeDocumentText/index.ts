import { runNormalizePipeline } from "./pipeline";

/**
 * getText で取得したテキストを、後続のカレンダーパーサー用正規表現に合う形式へ変換する。
 * @param text getText の戻り値
 * @return 正規化後のテキスト
 */
export function normalizeDocumentText(text: string): string {
  let result: string = "";

  if (text === "") {
    return result;
  }

  result = runNormalizePipeline(text);

  return result;
}
