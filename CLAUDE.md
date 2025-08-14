# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトはGoogle Apps Script (GAS)で作成されたGmail Reporterアプリケーションです。前日に受信したGmailメールを送信者別にグループ化し、件数を集計したサマリーレポートを作成してメールで送信します。Googleスプレッドシートを使用してフォーカスリストと無視リストを管理し、重要なメールを強調表示する機能を持ちます。

## 主要ファイル

- `main.js`: メインの実装ファイル。Gmail読み込み、送信者別集計、フィルタリング、レポート送信機能を含む
- `appsscript.json`: GASプロジェクトの設定ファイル（タイムゾーン、実行権限等）
- `README.md`: プロジェクトの基本的な説明

## 開発・デプロイメント

### テスト・実行
- Google Apps Script エディタ（script.google.com）でスクリプトエディタを開く
- `main()`関数を手動実行してテスト（内部で`sendDailyEmailSummary()`を呼び出し）
- ログは`Logger.log()`で出力され、GASエディタの実行ログタブで確認可能

### デプロイメント
- GASエディタでトリガーを設定し、日次実行スケジュールを設定
- 実行時間制限（6分）に注意

## 設定要件

### スクリプトプロパティ設定
- `SPREADSHEET_ID`: フォーカスリスト・無視リストを管理するGoogleスプレッドシートのID
- スクリプトプロパティは GAS エディタの「プロジェクト設定」→「スクリプトプロパティ」で設定

### Googleスプレッドシート設定
- 設定用スプレッドシートに以下の2つのシートを作成：
  - `focus`シート: A列に重要なメールアドレス（部分一致）
  - `ignore`シート: A列に無視するメールアドレス（部分一致）

### 権限
- Gmail読み取り権限
- メール送信権限
- Googleスプレッドシート読み取り権限

## アーキテクチャ

### メイン処理フロー
1. Googleスプレッドシートからフォーカスリストと無視リストを読み込み
2. 前日の日付範囲でGmail検索
3. 各メッセージの送信者アドレスを抽出・集計
4. 無視リストに含まれる送信者を除外
5. フォーカスリストに含まれる送信者を重要セクションに分類
6. 送信者別メール件数を降順でソート
7. サマリーレポートを作成し、メールで送信

### 主要関数
- `main()`: アプリケーションのエントリーポイント
- `sendDailyEmailSummary()`: メイン処理を実行
- `loadEmailListsFromSpreadsheet()`: スプレッドシートからリストを読み込み
- `loadEmailListFromSheet()`: 指定シートからメールアドレスリストを読み込み

### レポート形式
```
--- Gmail Daily Summary Report for YYYY/MM/DD ---

【重要】注目すべきメール:
========================
⚠️  important@example.com: 3件

送信者別メール件数:
========================
sender1@example.com: 5件
sender2@example.com: 2件
```
