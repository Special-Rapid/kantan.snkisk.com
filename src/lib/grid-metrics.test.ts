import { describe, expect, it } from 'vitest'
import { gridMetricsForFrame, maximumLineBandRatio } from './grid-metrics'

const compositions = [
  { characters: 10, lines: 20 }, { characters: 14, lines: 14 }, { characters: 20, lines: 10 },
  { characters: 20, lines: 20 }, { characters: 16, lines: 25 }, { characters: 25, lines: 16 },
  { characters: 20, lines: 25 }, { characters: 25, lines: 20 }, { characters: 30, lines: 40 },
  { characters: 40, lines: 30 }, { characters: 40, lines: 40 },
]

const gridDimensions = ({ direction, columns, rows, verticalSpread, horizontalSpread, cellSize, lineBandSize, crossBandSize, frameBorderSize = 1 }: {
  direction: 'vertical' | 'horizontal'
  columns: number
  rows: number
  verticalSpread: boolean
  horizontalSpread: boolean
  cellSize: number
  lineBandSize: number
  crossBandSize: number
  frameBorderSize?: number
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
    ? { width: frameBorderSize * 2 + columns * cellSize + lineBandCount * lineBandSize, height: frameBorderSize * 2 + rows * cellSize + Math.max(rows - 1, 0) * crossBandSize }
    : { width: frameBorderSize * 2 + columns * cellSize + Math.max(columns - 1, 0) * crossBandSize, height: frameBorderSize * 2 + rows * cellSize + lineBandCount * lineBandSize }
}

describe('原稿用紙の非計数帯', () => {
  it('全11規格・4組版で、成り立つ構成だけが行列間と中央帯をセルの半分以下に保つ', () => {
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

          if (!metrics) continue
          expect(metrics.cellSize).toBeGreaterThan(0)
          expect(metrics.lineBandSize).toBeGreaterThan(0)
          expect(metrics.lineBandSize).toBeLessThanOrEqual(metrics.cellSize * maximumLineBandRatio)
          expect(metrics.crossBandSize).toBeGreaterThanOrEqual(0)
          expect(metrics.crossBandSize).toBeLessThanOrEqual(metrics.cellSize * maximumLineBandRatio)
          if (verticalSpread || horizontalSpread) expect(metrics.spineBandSize).toBeGreaterThan(0)
          expect(metrics.spineBandSize).toBeLessThanOrEqual(metrics.cellSize * maximumLineBandRatio)
        }
      }
    }
  })

  it('標準20×20は全4組版で、半セル以下の帯だけで指定余白の内側を満たす', () => {
    const frames = [
      { direction: 'vertical' as const, columns: 20, rows: 20, verticalSpread: false, horizontalSpread: false, paperWidth: 182, paperHeight: 257 },
      { direction: 'vertical' as const, columns: 20, rows: 20, verticalSpread: true, horizontalSpread: false, paperWidth: 257, paperHeight: 182 },
      { direction: 'horizontal' as const, columns: 20, rows: 20, verticalSpread: false, horizontalSpread: true, paperWidth: 182, paperHeight: 257 },
      { direction: 'horizontal' as const, columns: 20, rows: 20, verticalSpread: false, horizontalSpread: false, paperWidth: 257, paperHeight: 182 },
    ]

    for (const frame of frames) {
      const width = frame.paperWidth * 0.8
      const height = frame.paperHeight * 0.8
      const metrics = gridMetricsForFrame({ ...frame, width, height })!
      const { width: gridWidth, height: gridHeight } = gridDimensions({ ...frame, cellSize: metrics.cellSize, lineBandSize: metrics.lineBandSize, crossBandSize: metrics.crossBandSize })

      expect(gridWidth).toBeCloseTo(width, 1)
      expect(gridHeight).toBeCloseTo(height, 1)
      expect(metrics.lineBandSize).toBeLessThanOrEqual(metrics.cellSize * maximumLineBandRatio)
      expect(metrics.crossBandSize).toBeLessThanOrEqual(metrics.cellSize * maximumLineBandRatio)
    }
  })

  it('全11規格・4組版を余白10〜40%で判定し、成り立つ構成だけが指定余白の内側を満たす', () => {
    let supported = 0
    let unsupported = 0
    for (const composition of compositions) {
      for (const direction of ['vertical', 'horizontal'] as const) {
        for (const orientation of ['portrait', 'landscape'] as const) {
          const verticalSpread = direction === 'vertical' && orientation === 'landscape'
          const horizontalSpread = direction === 'horizontal' && orientation === 'portrait'
          const columns = direction === 'vertical' ? composition.lines : composition.characters
          const rows = direction === 'vertical' ? composition.characters : composition.lines
          for (const paper of [{ width: 182, height: 257 }, { width: 210, height: 297 }]) {
            const paperWidth = orientation === 'portrait' ? paper.width : paper.height
            const paperHeight = orientation === 'portrait' ? paper.height : paper.width
            for (const totalMarginPercentage of [0, 10, 20, 30, 40]) {
              const metrics = gridMetricsForFrame({ direction, columns, rows, verticalSpread, horizontalSpread, width: paperWidth * (1 - totalMarginPercentage / 100), height: paperHeight * (1 - totalMarginPercentage / 100) })
              if (!metrics) {
                unsupported += 1
                continue
              }
              supported += 1
              const grid = gridDimensions({ direction, columns, rows, verticalSpread, horizontalSpread, cellSize: metrics.cellSize, lineBandSize: metrics.lineBandSize, crossBandSize: metrics.crossBandSize })
              expect(grid.width).toBeCloseTo(paperWidth * (1 - totalMarginPercentage / 100), 1)
              expect(grid.height).toBeCloseTo(paperHeight * (1 - totalMarginPercentage / 100), 1)
            }
          }
        }
      }
    }
    expect(supported).toBeGreaterThan(0)
    expect(unsupported).toBeGreaterThan(0)
  })

  it('4mmの印刷可能領域まで成立した構成だけが、印刷用の正方形マスと半セル以下の帯を使える', () => {
    let printSupported = 0
    let printUnsupported = 0
    for (const composition of compositions) {
      for (const direction of ['vertical', 'horizontal'] as const) {
        for (const orientation of ['portrait', 'landscape'] as const) {
          const verticalSpread = direction === 'vertical' && orientation === 'landscape'
          const horizontalSpread = direction === 'horizontal' && orientation === 'portrait'
          const columns = direction === 'vertical' ? composition.lines : composition.characters
          const rows = direction === 'vertical' ? composition.characters : composition.lines

          for (const paper of [{ width: 182, height: 257 }, { width: 210, height: 297 }]) {
            const paperWidth = orientation === 'portrait' ? paper.width : paper.height
            const paperHeight = orientation === 'portrait' ? paper.height : paper.width
            for (const totalMarginPercentage of [0, 10, 20, 30, 40]) {
              const screenMetrics = gridMetricsForFrame({ direction, columns, rows, verticalSpread, horizontalSpread, width: paperWidth * (1 - totalMarginPercentage / 100), height: paperHeight * (1 - totalMarginPercentage / 100) })
              if (!screenMetrics) continue

              const printWidth = (paperWidth - 8) * (1 - totalMarginPercentage / 100)
              const printHeight = (paperHeight - 8) * (1 - totalMarginPercentage / 100)
              const printBorderSize = 25.4 / 96
              const printMetrics = gridMetricsForFrame({ direction, columns, rows, verticalSpread, horizontalSpread, width: printWidth, height: printHeight, frameBorderSize: printBorderSize })
              if (!printMetrics) {
                printUnsupported += 1
                continue
              }
              printSupported += 1
              expect(printMetrics!.lineBandSize).toBeLessThanOrEqual(printMetrics!.cellSize * maximumLineBandRatio)
              expect(printMetrics!.crossBandSize).toBeLessThanOrEqual(printMetrics!.cellSize * maximumLineBandRatio)
              const printGrid = gridDimensions({ direction, columns, rows, verticalSpread, horizontalSpread, cellSize: printMetrics!.cellSize, lineBandSize: printMetrics!.lineBandSize, crossBandSize: printMetrics!.crossBandSize, frameBorderSize: printBorderSize })
              expect(printGrid.width).toBeCloseTo(printWidth, 1)
              expect(printGrid.height).toBeCloseTo(printHeight, 1)
            }
          }
        }
      }
    }
    expect(printSupported).toBeGreaterThan(0)
    expect(printUnsupported).toBeGreaterThan(0)
  })

  it('10×20の横書き・縦向きは補助帯を使って成立し、同じ字詰めの縦書き・縦向きは表示しない', () => {
    for (const paper of [{ width: 182, height: 257 }, { width: 210, height: 297 }]) {
      const horizontalPortrait = gridMetricsForFrame({ direction: 'horizontal', columns: 10, rows: 20, verticalSpread: false, horizontalSpread: true, width: paper.width * 0.8, height: paper.height * 0.8 })
      const verticalPortrait = gridMetricsForFrame({ direction: 'vertical', columns: 20, rows: 10, verticalSpread: false, horizontalSpread: false, width: paper.width * 0.8, height: paper.height * 0.8 })

      expect(horizontalPortrait).toBeDefined()
      expect(horizontalPortrait!.crossBandSize).toBeGreaterThan(0)
      expect(verticalPortrait).toBeUndefined()
    }
  })
})
