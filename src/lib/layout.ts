export type Direction = 'vertical' | 'horizontal'

export interface Composition {
  characters: number
  lines: number
}

export type ManuscriptCell = string | null

export const manuscriptCharacters = (text: string) =>
  Array.from(text.replaceAll(/\r\n?|\n/g, ''))

export const pageCapacity = ({ characters, lines }: Composition) => characters * lines

/**
 * 改行は次の行を始める指示として扱い、通常の空白は原稿用紙の一文字として残す。
 * 空セルも返すため、段落の改行をプレビューとPDFで同じ位置に再現できる。
 */
export const manuscriptPages = (text: string, composition: Composition): ManuscriptCell[][] => {
  const capacity = pageCapacity(composition)
  const pages: ManuscriptCell[][] = []
  let cells: ManuscriptCell[] = Array(capacity).fill(null)
  let cursor = 0
  let previousWasNewline = false

  const finishPage = () => {
    pages.push(cells)
    cells = Array(capacity).fill(null)
    cursor = 0
  }

  for (const token of Array.from(text.replaceAll(/\r\n?/g, '\n'))) {
    if (token === '\n') {
      if (cursor === capacity) {
        finishPage()
        if (previousWasNewline) cursor = composition.characters
        previousWasNewline = true
        continue
      }
      if (cursor === 0) cursor = composition.characters
      else if (cursor % composition.characters !== 0) cursor = Math.ceil(cursor / composition.characters) * composition.characters
      else if (previousWasNewline) cursor += composition.characters
      previousWasNewline = true
      continue
    }

    if (cursor === capacity) finishPage()
    cells[cursor] = token
    cursor += 1
    previousWasNewline = false
  }

  pages.push(cells)
  return pages
}

export const pageTotal = (text: string, composition: Composition) => manuscriptPages(text, composition).length

export const pageCharacters = (text: string, composition: Composition, page = 0) =>
  manuscriptPages(text, composition)[page] ?? Array(pageCapacity(composition)).fill(null)
