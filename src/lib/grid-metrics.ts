import type { Direction } from './layout'

export const maximumLineBandRatio = 0.5
const minimumLineBandSize = 0.1

export interface GridMetrics {
  cellSize: number
  lineBandSize: number
  crossBandSize: number
  spineBandSize: number
  fillsMarginFrame: boolean
}

export interface GridMetricsInput {
  direction: Direction
  columns: number
  rows: number
  verticalSpread: boolean
  horizontalSpread: boolean
  width: number
  height: number
  /** 計算単位における原稿罫線外枠の片側幅。画面はCSS px、印刷はmmで渡す。 */
  frameBorderSize?: number
}

/** 正方形マスを優先し、非計数帯はセルの半分以下に保つ。 */
export const gridMetricsForFrame = ({ direction, columns, rows, verticalSpread, horizontalSpread, width, height, frameBorderSize = 1 }: GridMetricsInput): GridMetrics | undefined => {
  if (width <= 0 || height <= 0) return undefined

  const leftColumns = Math.floor(columns / 2)
  const topRows = Math.floor(rows / 2)
  const verticalBands = verticalSpread
    ? Math.max(leftColumns - 1, 0) + Math.max(columns - leftColumns - 1, 0)
    : Math.max(columns - 1, 0)
  const horizontalBands = horizontalSpread
    ? Math.max(topRows - 1, 0) + Math.max(rows - topRows - 1, 0)
    : Math.max(rows - 1, 0)
  const availableWidth = Math.max(1, width - frameBorderSize * 2)
  const availableHeight = Math.max(1, height - frameBorderSize * 2)
  const lineAxisCells = direction === 'vertical' ? columns : rows
  const crossAxisCells = direction === 'vertical' ? rows : columns
  const lineAxisAvailable = direction === 'vertical' ? availableWidth : availableHeight
  const crossAxisAvailable = direction === 'vertical' ? availableHeight : availableWidth
  const lineBands = direction === 'vertical' ? verticalBands : horizontalBands
  const crossBandCount = direction === 'vertical' ? Math.max(rows - 1, 0) : Math.max(columns - 1, 0)
  const hasSpine = direction === 'vertical' ? verticalSpread : horizontalSpread
  const lineBandCount = lineBands + (hasSpine ? 1 : 0)
  const lowerCellSize = Math.max(
    lineAxisAvailable / (lineAxisCells + lineBandCount * maximumLineBandRatio),
    crossAxisAvailable / (crossAxisCells + crossBandCount * maximumLineBandRatio),
  )
  const upperCellSize = Math.min(
    lineBandCount > 0 ? (lineAxisAvailable - lineBandCount * minimumLineBandSize) / lineAxisCells : lineAxisAvailable / lineAxisCells,
    crossAxisAvailable / crossAxisCells,
  )
  const fillsMarginFrame = lowerCellSize <= upperCellSize && upperCellSize > 0
  if (!fillsMarginFrame) return undefined

  const cellSize = Math.max(1, upperCellSize)
  const lineBandSize = lineBandCount > 0
    ? Math.min(cellSize * maximumLineBandRatio, Math.max(minimumLineBandSize, (lineAxisAvailable - lineAxisCells * cellSize) / lineBandCount))
    : 0
  const crossBandSize = crossBandCount > 0
    ? Math.min(cellSize * maximumLineBandRatio, Math.max(0, (crossAxisAvailable - crossAxisCells * cellSize) / crossBandCount))
    : 0

  return { cellSize, lineBandSize, crossBandSize, spineBandSize: hasSpine ? lineBandSize : 0, fillsMarginFrame }
}
