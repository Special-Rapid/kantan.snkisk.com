import { describe, expect, it } from 'vitest'
import { maximumPrintLinkCharacters, parsePrintLink } from './print-link'

describe('AI印刷リンク', () => {
  it('本文と許可済み設定をフラグメントから復元する', () => {
    expect(parsePrintLink('#v=1&text=%E4%BD%9C%E6%96%87%0A%E3%81%A7%E3%81%99&direction=horizontal&paper=a4&orientation=portrait&composition=10x20&fontFamily=gothic&fontSize=large&margin=custom&customMarginPercentage=24&gridColor=%2300Aa99&autoParagraphIndent=0&showServiceMark=1')).toEqual({
      kind: 'valid',
      payload: { text: '作文\nです', direction: 'horizontal', paper: 'a4', orientation: 'portrait', composition: '10x20', fontFamily: 'gothic', fontSize: 'large', margin: 'custom', customMarginPercentage: 24, gridColor: '#00aa99', autoParagraphIndent: false, showServiceMark: true },
    })
  })

  it('通常のアンカーと未知の将来パラメータは既存の入力を壊さない', () => {
    expect(parsePrintLink('#preview')).toEqual({ kind: 'absent' })
    expect(parsePrintLink('#v=1&text=%E3%81%82&future=value')).toMatchObject({ kind: 'valid', payload: { text: 'あ' } })
  })

  it('既知設定の不正値と不完全なカスタム余白を拒否する', () => {
    expect(parsePrintLink('#v=1&text=%E3%81%82&direction=diagonal')).toEqual({ kind: 'invalid' })
    expect(parsePrintLink('#v=1&text=%E3%81%82&margin=custom')).toEqual({ kind: 'invalid' })
    expect(parsePrintLink('#v=1&text=%E3%81%82&margin=standard&customMarginPercentage=20')).toEqual({ kind: 'invalid' })
  })

  it('過大な本文を復元しない', () => {
    expect(parsePrintLink(`#v=1&text=${encodeURIComponent('あ'.repeat(maximumPrintLinkCharacters + 1))}`)).toEqual({ kind: 'too-long' })
  })
})
