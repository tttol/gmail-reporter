// Configuration: Replace with your Google Spreadsheet ID
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");

// Email lists - will be loaded from Google Spreadsheet
let FOCUS_LIST = [];
let IGNORE_LIST = [];

/**
 * Main entry point for the Gmail Reporter application
 */
function main() {
  sendDailyEmailSummary();
}


/**
 * Load email list from a specific sheet in the spreadsheet
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet The spreadsheet object
 * @param {string} sheetName Name of the sheet to load from
 * @return {Array<string>} Array of email addresses
 */
function loadEmailListFromSheet(spreadsheet, sheetName) {
  try {
    Logger.log(`sheet name: ${sheetName}`);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      const data = sheet.getRange('A:A').getValues();
      return data
        .flat()
        .filter(email => email && typeof email === 'string' && email.trim() !== '')
        .map(email => email.trim().toLowerCase());
    }
    return [];
  } catch (error) {
    Logger.log(`Error loading ${sheetName}: ${error.toString()}`);
    return [];
  }
}

/**
 * Load email lists from Google Spreadsheet
 * Expects a spreadsheet with two sheets: 'focus' and 'ignore'
 * Each sheet should have email addresses in column A
 */
function loadEmailListsFromSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!spreadsheet) {
      Logger.log('Cannot open spreadsheet.');
    }
    
    // Load focus list from 'focus' sheet
    FOCUS_LIST = loadEmailListFromSheet(spreadsheet, 'focus');
    
    // Load ignore list from 'ignore' sheet
    IGNORE_LIST = loadEmailListFromSheet(spreadsheet, 'ignore');
    
    Logger.log(`Loaded ${FOCUS_LIST.length} focus emails and ${IGNORE_LIST.length} ignore emails`);
  } catch (error) {
    Logger.log(`Error accessing spreadsheet: ${error.toString()}`);
    Logger.log('Please make sure SPREADSHEET_ID is set correctly and the spreadsheet is accessible');
  }
}
function sendDailyEmailSummary() {
  // Load email lists from spreadsheet
  loadEmailListsFromSpreadsheet();
  
  const recipientEmail = Session.getActiveUser().getEmail(); 
  const today = new Date();
  const tmpDate = new Date();
  tmpDate.setDate(today.getDate() - 1);
  const yesterday = tmpDate;
  const formattedDate = Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "yyyy/MM/dd");

  let summaryReport = `--- Gmail Daily Summary Report for ${formattedDate} ---\n\n`;

  try {
    // Search Gmail for yesterday's date
    const query = `after:${Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "yyyy/MM/dd")} before:${Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy/MM/dd")}`;
    const threads = GmailApp.search(query);

    if (threads.length === 0) {
      summaryReport += "昨日に受信したメールはありませんでした。\n";
    } else {
      // Group emails by sender address and count them
      const senderCounts = new Map();
      const focusCounts = new Map();
      let totalMessages = 0;

      for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const messages = thread.getMessages();

        for (let j = 0; j < messages.length; j++) {
          const message = messages[j];
          const sender = message.getFrom().toLowerCase();
          totalMessages++;

          // Check if sender should be ignored
          if (IGNORE_LIST.some(ignoreEmail => sender.includes(ignoreEmail))) {
            continue; // Skip this sender
          }

          // Count all non-ignored senders
          if (senderCounts.has(sender)) {
            senderCounts.set(sender, senderCounts.get(sender) + 1);
          } else {
            senderCounts.set(sender, 1);
          }

          // Separately track focus list senders
          if (FOCUS_LIST.some(focusEmail => sender.includes(focusEmail))) {
            if (focusCounts.has(sender)) {
              focusCounts.set(sender, focusCounts.get(sender) + 1);
            } else {
              focusCounts.set(sender, 1);
            }
          }
        }
      }

      summaryReport += `${formattedDate}に受信したメールが ${totalMessages} 件見つかりました。\n\n`;

      // Show focus list emails first if any
      if (focusCounts.size > 0) {
        summaryReport += "【重要】注目すべきメール:\n";
        summaryReport += "========================\n";
        const sortedFocusEmails = Array.from(focusCounts.entries()).sort((a, b) => b[1] - a[1]);
        for (const [sender, count] of sortedFocusEmails) {
          summaryReport += `⚠️  ${sender}: ${count}件\n`;
        }
        summaryReport += "\n";
      }

      // Show all other emails (excluding ignored ones)
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



