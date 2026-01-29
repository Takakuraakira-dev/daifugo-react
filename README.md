# 🃏 大富豪 React App

Reactで開発した「大富豪（Daifugo）」ブラウザゲームです。  
CPU対戦・勝敗判定・役（8切り/革命/イレブンバック）まで実装した、フロントエンドポートフォリオ作品です。

👉 デモURL  
https://takakuraakira-dev.github.io/daifugo-react/

---

## 🎮 機能一覧

✅ 4人対戦（YOU + CPU3人）  
✅ CPU自動ロジック  
✅ カード出し / パス  
✅ 勝敗判定（順位自動決定）  
✅ 役実装
- 8切り
- 革命
- イレブンバック

✅ メッセージ表示（「8切り！」「革命！」など）  
✅ 上下左右レイアウト（トランプ風UI）  
✅ レスポンシブ対応（スマホOK）  
✅ GitHub Pages デプロイ

---

## 🛠 技術スタック

- React (Vite)
- JavaScript (ES6)
- useState / useEffect
- CSS Grid / Flexbox
- Git / GitHub
- GitHub Pages

---

## 💡 工夫したポイント

### 🎯 ① 状態管理
- players / field / rankings などを useState で一元管理
- useEffectで勝敗自動判定

### 🎯 ② CPUロジック
- 手札をランクごとにグループ化
- 出せるカードを自動選択

### 🎯 ③ レイアウト
- CSS Gridで実装し、本物のトランプ配置を再現

### 🎯 ④ デプロイ
- gh-pages を使用して自動デプロイ構築

---
## 🚀 今後の改善予定

- アニメーション追加
- サウンド追加
- UIデザイン強化
- オンライン対戦機能（将来的に）
- 7渡し、10捨て、12ボンバーなどの役職追加
---

## 👤 Author

Akira Takakura  
Frontend Engineer Portfolio
