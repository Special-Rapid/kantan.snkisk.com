import { describe, expect, it } from 'vitest'
import { manuscriptCharacters, manuscriptDisplayCells, manuscriptPages, pageTotal } from './layout'

describe('原稿用紙の計算', () => {
  const composition = { characters: 2, lines: 2 }

  it('空の文章でも1ページを表示する', () => {
    expect(pageTotal('', composition)).toBe(1)
  })

  it('通常の空白を文字として残す', () => {
    expect(manuscriptCharacters('A B')).toEqual(['A', ' ', 'B'])
  })

  it('改行は本文文字数に含めない', () => {
    expect(manuscriptCharacters('A\nB')).toEqual(['A', 'B'])
  })

  it('改行で次の行を開始する', () => {
    expect(manuscriptPages('あ\nい', composition)[0]).toEqual(['あ', null, 'い', null])
  })

  it('行末の改行で次の行を二重に空けない', () => {
    expect(manuscriptPages('あい\nう', composition)[0]).toEqual(['あ', 'い', 'う', null])
  })

  it('連続した改行は空行を残す', () => {
    expect(manuscriptPages('あ\n\nい', composition)[0]).toEqual(['あ', null, null, null])
    expect(manuscriptPages('あ\n\nい', composition)[1]).toEqual(['い', null, null, null])
  })

  it('改ページ境界をまたぐ連続改行も空行を残す', () => {
    expect(manuscriptPages('あ\n\n\nい', composition)[1]).toEqual([null, null, 'い', null])
  })

  it('容量を超えると次ページを数える', () => {
    expect(pageTotal('あいうえお', composition)).toBe(2)
    expect(manuscriptPages('あいうえお', composition)[1]).toEqual(['お', null, null, null])
  })

  it('満ページ直後の改行では次ページの先頭から続ける', () => {
    expect(manuscriptPages('あいうえ\nお', composition)[1]).toEqual(['お', null, null, null])
  })

  it('段落の自動適用は最初の段落を1マスだけ下げる', () => {
    expect(manuscriptPages('あ', { characters: 3, lines: 2 }, { autoParagraphIndent: true })[0])
      .toEqual([null, 'あ', null, null, null, null])
  })

  it('単一改行・連続改行・行頭空白を同じ1マス字下げの段落境界として畳む', () => {
    const paragraphComposition = { characters: 3, lines: 3 }
    const expected = manuscriptPages('あ\nい', paragraphComposition, { autoParagraphIndent: true })

    expect(expected[0]).toEqual([null, 'あ', null, null, 'い', null, null, null, null])
    expect(manuscriptPages('あ\n\nい', paragraphComposition, { autoParagraphIndent: true })).toEqual(expected)
    expect(manuscriptPages('あ\n　い', paragraphComposition, { autoParagraphIndent: true })).toEqual(expected)
    expect(manuscriptPages('あ\n  い', paragraphComposition, { autoParagraphIndent: true })).toEqual(expected)
    expect(manuscriptPages('あ\n\tい', paragraphComposition, { autoParagraphIndent: true })).toEqual(expected)
  })

  it('段落の自動適用をオフにすると従来の改行組版を維持する', () => {
    expect(manuscriptPages('あ\nい', composition, { autoParagraphIndent: false })[0])
      .toEqual(manuscriptPages('あ\nい', composition)[0])
  })

  it('縦書きは先頭列を右端から均一に配置する', () => {
    expect(manuscriptDisplayCells(['あ', 'い', 'う', 'え'], composition, 'vertical')).toEqual(['う', 'あ', 'え', 'い'])
  })

  it('横書きは入力順をそのまま表示する', () => {
    expect(manuscriptDisplayCells(['あ', 'い', 'う', 'え'], composition, 'horizontal')).toEqual(['あ', 'い', 'う', 'え'])
  })
})
