export type Language = 'ja' | 'en'

export const copy = {
  ja: {
    body: '本文', hint: '文章を貼り付けるか、ここに入力してください。', direction: '読み方向', vertical: '縦書き', horizontal: '横書き', paper: '用紙サイズ', paperOrientation: '紙の向き', portrait: '縦向き', landscape: '横向き', composition: '文字数と行数', details: '詳細設定（任意）', fontFamily: 'フォントの種類', mincho: '明朝体', gothic: 'ゴシック体', fontSize: '文字サイズ', medium: '中', margin: '余白', marginNarrow: '狭め（10%）', marginWidePrint: '広め（30%）', marginCustom: 'カスタム', marginPercentage: '余白の割合', gridColor: '罫線の色', paragraphIndent: '段落を自動適用', serviceMark: '紙面左下に kantan.snkisk.com を入れる', preview: '仕上がりプレビュー', blank: '文章を貼り付けてください', layoutUnavailable: 'この組合せでは、正方形マス・余白・非計数帯を同時に保てません。紙の向きか文字数と行数を変更してください。', printMarginUnavailable: 'この余白では印刷の4 mm余白に収まりません。余白を5%以上に増やしてください。', save: 'PDFとして保存', saving: 'PDFを準備中…', print: '印刷する', printing: '印刷を開いています…', printReady: '印刷メニューを開きました。', pdfReady: 'PDFを保存しました。', pdfError: 'PDFを保存できませんでした。もう一度試してください。', retry: 'もう一度試す', printLinkInvalid: 'この印刷リンクを読み込めません。リンクを作り直してください。', printLinkTooLong: 'この印刷リンクの本文は長すぎます。本文を短くしてリンクを作り直してください。', info: '設定の説明', settingsInfo: '用紙、読み方向、文字数と行数で仕上がりを確認できます。細かな調整は必要な時だけ開けます。', sourceCount: '本文', sourceSuffix: '文字', page: 'ページ', appearance: '見た目', language: '言語', japanese: '日本語', english: 'English', system: 'システム', light: 'ライト', dark: 'ダーク', pages: 'ページ', close: '閉じる', characters: '字', lines: '行', small: '小', standard: '標準（20%）', large: '大', serviceName: 'kantan.snkisk.com', copyright: '© 2026 新快速(Special-Rapid)', contact: 'contact@snkisk.com'
  },
  en: {
    body: 'Text', hint: 'Paste or write your text here.', direction: 'Writing direction', vertical: 'Vertical', horizontal: 'Horizontal', paper: 'Paper size', paperOrientation: 'Paper orientation', portrait: 'Portrait', landscape: 'Landscape', composition: 'Characters and lines', details: 'Optional settings', fontFamily: 'Font family', mincho: 'Mincho', gothic: 'Gothic', fontSize: 'Text size', medium: 'Medium', margin: 'Margins', marginNarrow: 'Narrow (10%)', marginWidePrint: 'Wide (30%)', marginCustom: 'Custom', marginPercentage: 'Margin ratio', gridColor: 'Grid color', paragraphIndent: 'Apply paragraph indents', serviceMark: 'Add kantan.snkisk.com at the lower left', preview: 'Layout preview', blank: 'Paste your text to begin', layoutUnavailable: 'This combination cannot keep square cells, margins, and spacing bands together. Change the paper orientation or character/line layout.', printMarginUnavailable: 'This margin does not fit within the printer\'s 4 mm margin. Increase the margin to at least 5%.', save: 'Save as PDF', saving: 'Preparing PDF…', print: 'Print', printing: 'Opening print…', printReady: 'Print dialog opened.', pdfReady: 'PDF saved.', pdfError: 'PDF could not be saved. Please try again.', retry: 'Try again', printLinkInvalid: 'This print link could not be read. Create the link again.', printLinkTooLong: 'This print link contains too much text. Shorten the text and create the link again.', info: 'About settings', settingsInfo: 'Choose paper, direction, and a character/line layout. Open the optional settings only when you need finer control.', sourceCount: 'Text', sourceSuffix: 'characters', page: 'Page', appearance: 'Appearance', language: 'Language', japanese: 'Japanese', english: 'English', system: 'System', light: 'Light', dark: 'Dark', pages: 'pages', close: 'Close', characters: 'characters', lines: 'lines', small: 'Small', standard: 'Standard (20%)', large: 'Large', serviceName: 'kantan.snkisk.com', copyright: '© 2026 新快速(Special-Rapid)', contact: 'contact@snkisk.com'
  },
} as const

export type Labels = Record<keyof typeof copy.ja, string>

const aiPrintPrompt = {
  ja: '大学の論文を作って。kantan.snkisk.comの説明を読んで、同サイトで開く本文入り印刷URLを返して。追加の質問や公開は不要。',
  en: 'Write a college essay. Read kantan.snkisk.com\'s instructions and return a text-filled print URL that opens on that site. No follow-up questions or publishing.',
} as const

export const rootPromptCopy = {
  ja: {
    prefix: '',
    topics: ['大学の論文', '謝罪文', '読書感想文', 'お礼状'],
    suffix: 'を作って。kantan.snkisk.comの説明を読んで、同サイトで開く本文入り印刷URLを返して。追加の質問や公開は不要。',
  },
  en: {
    prefix: 'Write ',
    topics: ['a college essay', 'an apology letter', 'a book report', 'a thank-you letter'],
    suffix: '. Read kantan.snkisk.com\'s instructions and return a text-filled print URL that opens on that site. No follow-up questions or publishing.',
  },
} as const

export const documentationCopy = {
  ja: {
    title: 'AIから印刷する — kantan',
    eyebrow: 'kantan documentation',
    heading: 'AIで作った文章を、そのまま原稿用紙にする',
    lead: '下の依頼文は、作りたい文章を伝え、kantanの説明を読んだうえで本文入り印刷URLを返してもらうための例です。リンクを開き、内容を確認して印刷またはPDF保存してください。',
    instructionHeading: 'AIへの伝え方',
    instruction: '題材を伝え、サイトの説明を確認して本文入り印刷URLを返すように頼みます。',
    examplePrompt: aiPrintPrompt.ja,
    promptGroupLabel: 'AIへの印刷依頼文',
    copyPrompt: '依頼文をコピー',
    copiedPrompt: 'コピーしました',
    copyingPrompt: 'コピー中…',
    copyPromptError: 'コピーできませんでした。文章を選択してコピーしてください。',
    privacyHeading: '共有するときの注意',
    privacy: '本文と設定はURLの # より後ろに入ります。この部分はサイトへ送信されませんが、リンクを受け取った人には本文を読まれるため、個人情報や秘密の文章は共有しないでください。',
    fallbackHeading: 'HTMLファイルが返ってきた場合',
    fallback: 'kantanはファイルのアップロードには対応していません。「大学の論文を作って。kantan.snkisk.comの説明を読んで、同サイトで開く本文入り印刷URLを返して」と頼み直してください。それでもリンクを作れない場合は、文章をコピーしてkantanの本文欄に貼り付けてください。',
    start: 'kantanを開く',
  },
  en: {
    title: 'Print from AI — kantan',
    eyebrow: 'kantan documentation',
    heading: 'Turn AI-written text into manuscript paper',
    lead: 'The prompt below tells the AI what to write, asks it to read kantan\'s instructions, and requests a print URL with the text already filled in. Open the link, review the preview, then print or save as PDF.',
    instructionHeading: 'What to ask the AI',
    instruction: 'Name the kind of text you want and ask the AI to read the site instructions before returning a text-filled print URL.',
    examplePrompt: aiPrintPrompt.en,
    promptGroupLabel: 'AI print request',
    copyPrompt: 'Copy prompt',
    copiedPrompt: 'Copied',
    copyingPrompt: 'Copying…',
    copyPromptError: 'Could not copy. Select and copy the text instead.',
    privacyHeading: 'Sharing notice',
    privacy: 'The text and settings are placed after # in the URL. That portion is not sent to the site, but anyone who receives the link can read the text. Do not share private or sensitive writing this way.',
    fallbackHeading: 'If the AI returns an HTML file',
    fallback: 'kantan does not accept file uploads. If the AI returns an artifact or asks what topic to write about, ask it to read kantan.snkisk.com and return a text-filled print URL that opens on that same site without publishing or asking a follow-up. If it still cannot create a link, copy the text and paste it into kantan.',
    start: 'Open kantan',
  },
} as const
