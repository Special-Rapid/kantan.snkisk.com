export const printLinkVersion = '1'
export const maximumPrintLinkCharacters = 20_000

export type PrintLinkPayload = {
  text: string
  direction?: 'vertical' | 'horizontal'
  paper?: 'b5' | 'a4'
  orientation?: 'portrait' | 'landscape'
  composition?: '10x20' | '14x14' | '16x25' | '20x10' | '20x20' | '20x25' | '25x16' | '25x20' | '30x40' | '40x30' | '40x40'
  fontFamily?: 'mincho' | 'gothic'
  fontSize?: 'small' | 'normal' | 'large'
  margin?: 'narrow' | 'standard' | 'wide' | 'custom'
  customMarginPercentage?: number
  gridColor?: string
  autoParagraphIndent?: boolean
  showServiceMark?: boolean
}

export type PrintLinkResult =
  | { kind: 'absent' }
  | { kind: 'invalid' }
  | { kind: 'too-long' }
  | { kind: 'valid'; payload: PrintLinkPayload }

const directions = new Set<NonNullable<PrintLinkPayload['direction']>>(['vertical', 'horizontal'])
const papers = new Set<NonNullable<PrintLinkPayload['paper']>>(['b5', 'a4'])
const orientations = new Set<NonNullable<PrintLinkPayload['orientation']>>(['portrait', 'landscape'])
const compositions = new Set<NonNullable<PrintLinkPayload['composition']>>(['10x20', '14x14', '16x25', '20x10', '20x20', '20x25', '25x16', '25x20', '30x40', '40x30', '40x40'])
const fontFamilies = new Set<NonNullable<PrintLinkPayload['fontFamily']>>(['mincho', 'gothic'])
const fontSizes = new Set<NonNullable<PrintLinkPayload['fontSize']>>(['small', 'normal', 'large'])
const margins = new Set<NonNullable<PrintLinkPayload['margin']>>(['narrow', 'standard', 'wide', 'custom'])

const valueOrInvalid = <T extends string>(params: URLSearchParams, name: string, allowed: Set<T>): T | undefined | null => {
  const value = params.get(name)
  if (value === null) return undefined
  return allowed.has(value as T) ? value as T : null
}

const booleanOrInvalid = (params: URLSearchParams, name: string): boolean | undefined | null => {
  const value = params.get(name)
  if (value === null) return undefined
  if (value === '1') return true
  if (value === '0') return false
  return null
}

/**
 * `#`以降はHTTPリクエストへ送られないため、本文をサーバーへ保存せずに印刷設定を渡せる。
 * 未知のパラメータは将来拡張との互換性のため無視し、既知パラメータの不正値だけを拒否する。
 */
export function parsePrintLink(hash: string): PrintLinkResult {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash
  if (!fragment) return { kind: 'absent' }

  const params = new URLSearchParams(fragment)
  if (!params.has('v')) return { kind: 'absent' }
  if (params.get('v') !== printLinkVersion || !params.has('text')) return { kind: 'invalid' }

  const text = params.get('text') ?? ''
  if (Array.from(text).length > maximumPrintLinkCharacters) return { kind: 'too-long' }

  const direction = valueOrInvalid(params, 'direction', directions)
  const paper = valueOrInvalid(params, 'paper', papers)
  const orientation = valueOrInvalid(params, 'orientation', orientations)
  const composition = valueOrInvalid(params, 'composition', compositions)
  const fontFamily = valueOrInvalid(params, 'fontFamily', fontFamilies)
  const fontSize = valueOrInvalid(params, 'fontSize', fontSizes)
  const margin = valueOrInvalid(params, 'margin', margins)
  const autoParagraphIndent = booleanOrInvalid(params, 'autoParagraphIndent')
  const showServiceMark = booleanOrInvalid(params, 'showServiceMark')
  const gridColorValue = params.get('gridColor')
  const gridColor = gridColorValue === null ? undefined : /^#[0-9a-f]{6}$/i.test(gridColorValue) ? gridColorValue.toLowerCase() : null

  if ([direction, paper, orientation, composition, fontFamily, fontSize, margin, autoParagraphIndent, showServiceMark, gridColor].some((value) => value === null)) return { kind: 'invalid' }

  const customMarginValue = params.get('customMarginPercentage')
  const customMarginPercentage = customMarginValue === null ? undefined : Number(customMarginValue)
  if (margin === 'custom' && (!Number.isInteger(customMarginPercentage) || customMarginPercentage! < 0 || customMarginPercentage! > 40)) return { kind: 'invalid' }
  if (margin !== 'custom' && customMarginValue !== null) return { kind: 'invalid' }

  return { kind: 'valid', payload: {
    text,
    direction: direction ?? undefined,
    paper: paper ?? undefined,
    orientation: orientation ?? undefined,
    composition: composition ?? undefined,
    fontFamily: fontFamily ?? undefined,
    fontSize: fontSize ?? undefined,
    margin: margin ?? undefined,
    customMarginPercentage,
    gridColor: gridColor ?? undefined,
    autoParagraphIndent: autoParagraphIndent ?? undefined,
    showServiceMark: showServiceMark ?? undefined,
  } }
}
