# kantan

文章を貼り付け、用紙サイズ・文字数と行数・縦書き／横書きを選ぶだけで、仕上がりをリアルタイムに確認できるWebサービスです。

## できること

- B5 / A4、縦書き / 横書き、文字数と行数を選択
- 原稿用紙の仕上がりをリアルタイムに確認
- 必要な場合だけ、明朝体／ゴシック体、文字サイズ、余白、罫線色、紙の向きを「詳細設定（任意）」で調整
- 薄い茶色の罫線を既定にし、色を選んで変更可能
- 紙面左下の `kantan.snkisk.com` 表記は既定でオン。オフはその場だけで、次回は再びオン
- B5 / A4寸法のPDFを直接保存
- ブラウザの印刷メニューを開く
- 日本語 / English、System / Light / Dark を保存

## ローカル起動

Node.js 22 以上で実行します。

```bash
npm install
npm run dev
```

## 検証・公開

```bash
npm run typecheck
npm test
npm run build
npm run deploy
```

Cloudflare Workers Static Assets を使用しています。`wrangler.jsonc` の `assets.directory` は `dist` です。

## Cloudflare公開（ユーザー実行）

Cloudflare Workersの作成、GitHub連携、カスタムドメインの設定は、このリポジトリをGitHubへ公開した後に次の順で行えます。

1. Cloudflare Dashboardで **Workers & Pages** を開き、**Create application** からGitHubリポジトリを接続します。
2. ビルドコマンドを `npm run build`、出力先を `dist` に設定します。Node.jsは22以上を選びます。
3. 初回デプロイ完了後、Workerの **Settings → Domains & Routes** で `kantan.snkisk.com` を追加します。
4. DNSがCloudflare管理外の場合は、表示されるCNAMEまたはネームサーバー設定をDNS事業者側へ反映します。
5. `https://kantan.snkisk.com` を開き、入力・PDF保存・印刷を確認します。失敗時はCloudflareのDeploymentsログでビルドログを確認し、設定を戻す場合は直前のデプロイを再デプロイします。
