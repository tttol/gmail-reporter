/**
 * 前日に受信したGmailのメールを読み込み、サマリーレポートを作成してメールで送信します。
 * LLM（大規模言語モデル）による要約機能を組み込みました。
 * 注意: LLM APIの呼び出しは概念的な実装です。実際のAPIキーとエンドポイントを設定してください。
 */
function sendDailyEmailSummary() {
  // レポートの送信先メールアドレスを設定してください
  const recipientEmail = Session.getActiveUser().getEmail(); // スクリプトを実行しているユーザーのメールアドレス

  // 取得対象の日付を前日に設定
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedDate = Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "yyyy/MM/dd");

  let summaryReport = `--- Gmail Daily Summary Report for ${formattedDate} ---\n\n`;

  try {
    // 昨日の日付でGmailを検索
    const query = `after:${Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "yyyy/MM/dd")} before:${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd")}`;
    const threads = GmailApp.search(query);

    if (threads.length === 0) {
      summaryReport += "昨日に受信したメールはありませんでした。\n";
    } else {
      summaryReport += `昨日に受信したメールが ${threads.length} 件見つかりました。\n\n`;

      for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const messages = thread.getMessages();

        for (let j = 0; j < messages.length; j++) {
          const message = messages[j];
          summaryReport += `--- メール ${i + 1}-${j + 1} ---\n`;
          summaryReport += `件名: ${message.getSubject()}\n`;
          summaryReport += `送信者: ${message.getFrom()}\n`;
          summaryReport += `日時: ${Utilities.formatDate(message.getDate(), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss")}\n`;
          summaryReport += `本文 (要約):\n`;

          const body = message.getPlainBody();

          // LLM要約の呼び出し
          // 注: この関数は概念的な実装です。実際のLLM API呼び出しに置き換える必要があります。
          // APIキーをスクリプトプロパティに設定してください。
          // const summarizedBody = summarizeTextWithLLM(body);
          // summaryReport += `${summarizedBody}\n\n`;
        }
      }
    }

    // レポートをメールで送信
    GmailApp.sendEmail(recipientEmail, `【自動レポート】${formattedDate} のGmailサマリー`, summaryReport);
    Logger.log("Daily email summary sent successfully.");

  } catch (error) {
    Logger.log(`Error sending daily email summary: ${error.toString()}`);
    GmailApp.sendEmail(recipientEmail, `【エラー】Gmailサマリーレポートの作成`, `レポート作成中にエラーが発生しました: ${error.toString()}`);
  }
}

/**
 * LLMサービスにテキストを送信して要約を取得する概念的な関数。
 * 実際には、LLM APIのエンドポイントとAPIキー、リクエスト/レスポンス形式に合わせて調整が必要です。
 * @param {string} textToSummarize 要約するテキスト
 * @returns {string} 要約されたテキスト
 */
function summarizeTextWithLLM(textToSummarize) {
  const apiKey = getApiKey(); // スクリプトプロパティからAPIキーを取得
  if (!apiKey) {
    Logger.log("APIキーが設定されていません。LLM要約はスキップされます。");
    return `[要約機能無効: APIキーが設定されていません。] ${textToSummarize.substring(0, Math.min(textToSummarize.length, 500))}...`;
  }

  // Gemini APIのURL (これは一般的なプレースホルダーです。実際のAPIエンドポイントを確認してください)
  // 例えば、Google Cloud Functionsなどを経由して呼び出すことを推奨します。
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{ text: `以下のメール本文を日本語で簡潔に要約してください。:\n\n${textToSummarize}` }]
    }]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // エラー時に例外を発生させず、レスポンスオブジェクトで処理できるようにする
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 200) {
      const parsedResponse = JSON.parse(responseText);
      // Gemini APIの応答構造に合わせて要約テキストを抽出
      if (parsedResponse.candidates && parsedResponse.candidates.length > 0 &&
          parsedResponse.candidates[0].content && parsedResponse.candidates[0].content.parts &&
          parsedResponse.candidates[0].content.parts.length > 0) {
        return parsedResponse.candidates[0].content.parts[0].text;
      } else {
        Logger.log(`LLM応答の形式が予期されていません: ${responseText}`);
        return `[要約エラー: 応答形式が無効です] ${textToSummarize.substring(0, Math.min(textToSummarize.length, 500))}...`;
      }
    } else {
      Logger.log(`LLM APIエラー: ステータスコード ${responseCode}, 応答: ${responseText}`);
      return `[要約エラー: API呼び出し失敗 ${responseCode}] ${textToSummarize.substring(0, Math.min(textToSummarize.length, 500))}...`;
    }
  } catch (e) {
    Logger.log(`LLM API呼び出し中にエラーが発生しました: ${e.toString()}`);
    return `[要約エラー: ネットワーク/スクリプトエラー] ${textToSummarize.substring(0, Math.min(textToSummarize.length, 500))}...`;
  }
}

/**
 * スクリプトプロパティからAPIキーを取得します。
 * APIキーを安全に保存するために使用します。
 * @returns {string|null} APIキー、または設定されていない場合はnull
 */
function getApiKey() {
  // スクリプトプロパティに保存されたAPIキーの名前
  const SCRIPT_PROPERTY_KEY = 'GEMINI_API_KEY'; 
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty(SCRIPT_PROPERTY_KEY);
  return apiKey;
}

/**
 * APIキーをスクリプトプロパティに設定するための関数。
 * この関数は一度だけ手動で実行してください。
 * @param {string} apiKey 設定するGemini APIキー
 */
function setApiKey(apiKey) {
  const SCRIPT_PROPERTY_KEY = 'GEMINI_API_KEY';
  PropertiesService.getScriptProperties().setProperty(SCRIPT_PROPERTY_KEY, apiKey);
  Logger.log("APIキーが設定されました。");
}
