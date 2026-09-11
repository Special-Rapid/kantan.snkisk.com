import { describe, expect, it } from 'vitest'
import { gridMetricsForFrame, maximumLineBandRatio } from './grid-metrics'

const compositions = [
  { characters: 10, lines: 20 }, { characters: 14, lines: 14 }, { characters: 20, lines: 10 },
  { characters: 20, lines: 20 }, { characters: 16, lines: 25 }, { characters: 25, lines: 16 },
  { characters: 20, lines: 25 }, { characters: 25, lines: 20 }, { characters: 30, lines: 40 },
  { characters: 40, lines: 30 }, { characters: 40, lines: 40 },
]

const gridDimensions = ({ direction, columns, rows, verticalSpread, horizontalSpread, cellSize, lineBandSize }: {
  direction: 'vertical' | 'horizontal'
  columns: number
  rows: number
  verticalSpread: boolean
  horizontalSpread: boolean
  cellSize: number
  lineBandSize: number
}) => {
  const leftColumns = Math.floor(columns / 2)
  const topRows = Math.floor(rows / 2)
  const verticalBands = verticalSpread
    ? Math.max(leftColumns - 1, 0) + Math.max(columns - leftColumns - 1, 0)
    : Math.max(columns - 1, 0)
  const horizontalBands = horizontalSpread
    ? Math.max(topRows - 1, 0) + Math.max(rows - topRows - 1, 0)
    : Math.max(rows - 1, 0)
  const lineBandCount = direction === 'vertical' ? verticalBands + (verticalSpread ? 1 : 0) : horizontalBands + (horizontalSpread ? 1 : 0)

  return direction === 'vertical'
    ? { width: 2 + columns * cellSize + lineBandCount * lineBandSize, height: 2 + rows * cellSize }
    : { width: 2 + columns * cellSize, height: 2 + rows * cellSize + lineBandCount * lineBandSize }
}

describe('原稿用紙の非計数帯', () => {
  it('全11規格・4組版で行列間と中央帯をセルの半分以下に保つ', () => {
    for (const composition of compositions) {
      for (const direction of ['vertical', 'horizontal'] as const) {
        for (const orientation of ['portrait', 'landscape'] as const) {
          const verticalSpread = direction === 'vertical' && orientation === 'landscape'
          const horizontalSpread = direction === 'horizontal' && orientation === 'portrait'
          const metrics = gridMetricsForFrame({
            direction,
            columns: direction === 'vertical' ? composition.lines : composition.characters,
            rows: direction === 'vertical' ? composition.characters : composition.lines,
            verticalSpread,
            horizontalSpread,
            width: orientation === 'portrait' ? 500 : 780,
            height: orientation === 'portrait' ? 780 : 500,
          })

          expect(metrics).toBeDefined()
          expect(metrics!.cellSize).toBeGreaterThan(0)
          expect(metrics!.lineBandSize).toBeGreaterThan(0)
          expect(metrics!.lineBandSize).toBeLessThanOrEqual(metrics!.cellSize * maximumLineBandRatio)
          if (verticalSpread || horizontalSpread) expect(metrics!.spineBandSize).toBeGreaterThan(0)
          expect(metrics!.spineBandSize).toBeLessThanOrEqual(metrics!.cellSize * maximumLineBandRatio)
        }
      }
    }
  })

  it('標準20×20では半セル以下の帯だけで紙端から罫線までの余白を揃える', () => {
    const frames = [
      { direction: 'vertical' as const, columns: 20, rows: 20, verticalSpread: true, horizontalSpread: false, paperWidth: 257, paperHeight: 182, lineBandCount: 19 },
      { direction: 'horizontal' as const, columns: 20, rows: 20, verticalSpread: false, horizontalSpread: true, paperWidth: 182, paperHeight: 257, lineBandCount: 19 },
    ]

    for (const frame of frames) {
      const paperPadding = frame.paperWidth * 0.02
      const width = frame.paperWidth - paperPadding * 2
      const height = frame.paperHeight - paperPadding * 2
      const metrics = gridMetricsForFrame({ ...frame, width, height })!
      const { width: gridWidth, height: gridHeight } = gridDimensions({ ...frame, cellSize: metrics.cellSize, lineBandSize: metrics.lineBandSize })
      const horizontalMargin = (frame.paperWidth - gridWidth) / 2
      const verticalMargin = (frame.paperHeight - gridHeight) / 2

      expect(Math.abs(horizontalMargin - verticalMargin)).toBeLessThan(0.05)
      expect(metrics.lineBandSize).toBeLessThanOrEqual(metrics.cellSize * maximumLineBandRatio)
    }
  })

  it('全11規格・4組版で、揃えられる余白は揃え、両立しない罫線面は中央に収める', () => {
    for (const composition of compositions) {
      for (const direction of ['vertical', 'horizontal'] as const) {
        for (const orientation of ['portrait', 'landscape'] as const) {
          const verticalSpread = direction === 'vertical' && orientation === 'landscape'
          const horizontalSpread = direction === 'horizontal' && orientation === 'portrait'
          const columns = direction === 'vertical' ? composition.lines : composition.characters
          const rows = direction === 'vertical' ? composition.characters : composition.lines
          const paperWidth = orientation === 'portrait' ? 182 : 257
          const paperHeight = orientation === 'portrait' ? 257 : 182
          const paperPadding = paperWidth * 0.02
          const metrics = gridMetricsForFrame({ direction, columns, rows, verticalSpread, horizontalSpread, width: paperWidth - paperPadding * 2, height: paperHeight - paperPadding * 2 })!
          const grid = gridDimensions({ direction, columns, rows, verticalSpread, horizontalSpread, cellSize: metrics.cellSize, lineBandSize: metrics.lineBandSize })
          const horizontalMargin = (paperWidth - grid.width) / 2
          const verticalMargin = (paperHeight - grid.height) / 2

          const marginDifference = Math.abs(horizontalMargin - verticalMargin)

          if (metrics.outerMarginsBalanced) {
            expect(marginDifference).toBeLessThan(0.05)
          } else {
            expect(horizontalMargin).toBeGreaterThanOrEqual(0)
            expect(verticalMargin).toBeGreaterThanOrEqual(0)
            expect(metrics.lineBandSize).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})
