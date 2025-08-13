/**
 * 前日に受信したGmailのメールを読み込み、サマリーレポートを作成してメールで送信します。
 */
function sendDailyEmailSummary() {
  const recipientEmail = Session.getActiveUser().getEmail(); 
  const today = new Date();
  const yesterday = today.setDate(today.getDate() - 1);
  const formattedDate = Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "yyyy/MM/dd");

  let summaryReport = `--- Gmail Daily Summary Report for ${formattedDate} ---\n\n`;

  try {
    // 昨日の日付でGmailを検索
    const query = `after:${Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "yyyy/MM/dd")} before:${Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy/MM/dd")}`;
    const threads = GmailApp.search(query);

    if (threads.length === 0) {
      summaryReport += "昨日に受信したメールはありませんでした。\n";
    } else {
      // Group emails by sender address and count them
      const senderCounts = new Map();
      let totalMessages = 0;

      for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const messages = thread.getMessages();

        for (let j = 0; j < messages.length; j++) {
          const message = messages[j];
          const sender = message.getFrom();
          totalMessages++;

          if (senderCounts.has(sender)) {
            senderCounts.set(sender, senderCounts.get(sender) + 1);
          } else {
            senderCounts.set(sender, 1);
          }
        }
      }

      summaryReport += `昨日に受信したメールが ${totalMessages} 件見つかりました。\n\n`;
      summaryReport += "送信者別メール件数:\n";
      summaryReport += "========================\n";

      // Sort senders by email count (descending order)
      const sortedSenders = Array.from(senderCounts.entries()).sort((a, b) => b[1] - a[1]);

      for (const [sender, count] of sortedSenders) {
        summaryReport += `${sender}: ${count}件\n`;
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



