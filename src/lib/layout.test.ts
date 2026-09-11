import { describe, expect, it } from 'vitest'
import { manuscriptCharacters, manuscriptPages, pageTotal } from './layout'

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
})
