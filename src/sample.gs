/**
 * clasp連携確認用の最小サンプル。
 * GASエディタから実行するとログにメッセージを出力します。
 */
function helloClasp() {
  const message = 'Hello from clasp sample';
  Logger.log(message);
  return message;
}

/**
 * Webアプリとしてデプロイした場合の簡易レスポンス。
 */
function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      message: 'GAS sample is running',
      timestamp: new Date().toISOString(),
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
