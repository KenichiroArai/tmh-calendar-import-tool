/** Script Properties で必須となるキー */
export type ConfigKey =
  | "IMPORT_TARGET_FOLDER_ID"
  | "IMPORT_COMPLETED_FOLDER_ID"
  | "INTERMEDIATE_FILE_GENERATION_FOLDER_ID"
  | "CALENDAR_ID";

/**
 * Script Properties から値を取得する。
 * @param {string} key キー
 * @return {string} 値
 */
export function getRequiredConfig(key: ConfigKey): string {
  const result =
    PropertiesService.getScriptProperties().getProperty(key) ?? "";

  if (!result) {
    throw new Error(
      "Script Properties の設定値が未定義です。GASエディタで設定してください: " +
        key,
    );
  }
  return result;
}
