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

export const documentationCopy = {
  ja: {
    title: 'AIから印刷する — kantan',
    eyebrow: 'kantan documentation',
    heading: 'AIで作った文章を、そのまま原稿用紙にする',
    lead: 'AIにkantanで印刷したいと伝えると、本文と設定を入れたリンクを作成できます。リンクを開いたら、内容を確認してPDF保存または印刷を押すだけです。',
    instructionHeading: 'AIへの伝え方',
    instruction: '作文を作ってもらった後、次のように依頼してください。AIがこの仕様を利用できる場合は、本文入りのkantanリンクを返します。',
    examplePrompt: 'この文章を kantan.snkisk.com で、20字×20行の縦書き原稿用紙として印刷できるリンクにして。',
    privacyHeading: '共有するときの注意',
    privacy: '本文と設定はURLの # より後ろに入ります。この部分はサイトへ送信されませんが、リンクを受け取った人には本文を読まれるため、個人情報や秘密の文章は共有しないでください。',
    fallbackHeading: 'リンクを作れないAIの場合',
    fallback: 'AIが仕様を参照できないときは、文章をコピーしてkantanの本文欄に貼り付ければ、同じように印刷できます。',
    start: 'kantanを開く',
  },
  en: {
    title: 'Print from AI — kantan',
    eyebrow: 'kantan documentation',
    heading: 'Turn AI-written text into manuscript paper',
    lead: 'Tell an AI that you want to print with kantan. It can create a link containing your text and settings; open it, review the result, then save as PDF or print.',
    instructionHeading: 'What to ask the AI',
    instruction: 'After the AI creates your text, make a request like this. An AI that can use this specification can return a kantan link with the text included.',
    examplePrompt: 'Create a kantan.snkisk.com link that prints this text on vertical 20 × 20 manuscript paper.',
    privacyHeading: 'Sharing notice',
    privacy: 'The text and settings are placed after # in the URL. That portion is not sent to the site, but anyone who receives the link can read the text. Do not share private or sensitive writing this way.',
    fallbackHeading: 'If the AI cannot create a link',
    fallback: 'Copy the text and paste it into kantan. You can then choose the same layout and print it normally.',
    start: 'Open kantan',
  },
} as const
