# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトはGoogle Apps Script (GAS)で作成されたGmail Reporterアプリケーションです。前日に受信したGmailメールを読み込み、サマリーレポートを作成してメールで送信します。

## 主要ファイル

- `main.js`: メインの実装ファイル。Gmail読み込み、レポート送信機能を含む
- `appsscript.json`: GASプロジェクトの設定ファイル（タイムゾーン、実行権限等）
- `README.md`: プロジェクトの基本的な説明

## 開発・デプロイメント

### テスト・実行
- Google Apps Script エディタ（script.google.com）でスクリプトエディタを開く
- `sendDailyEmailSummary()`関数を手動実行してテスト
- ログは`Logger.log()`で出力され、GASエディタの実行ログタブで確認可能

### デプロイメント
- GASエディタでトリガーを設定し、日次実行スケジュールを設定
- 実行時間制限（6分）に注意

## 設定要件

### 権限
- Gmail読み取り権限
- メール送信権限

## アーキテクチャ

### メイン処理フロー
1. 前日の日付範囲でGmail検索
2. 各メッセージの件名、送信者、日時を抽出
3. メール本文を最初の500文字まで表示
4. サマリーレポートを作成し、メールで送信