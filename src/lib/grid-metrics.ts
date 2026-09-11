import type { Direction } from './layout'

export const maximumLineBandRatio = 0.5
const minimumLineBandSize = 1

export interface GridMetrics {
  cellSize: number
  lineBandSize: number
  spineBandSize: number
  outerMarginsBalanced: boolean
}

export interface GridMetricsInput {
  direction: Direction
  columns: number
  rows: number
  verticalSpread: boolean
  horizontalSpread: boolean
  width: number
  height: number
}

const maximumBalancedCellSize = ({ lineAxisAvailable, crossAxisAvailable, lineAxisCells, crossAxisCells, lineBandCount }: {
  lineAxisAvailable: number
  crossAxisAvailable: number
  lineAxisCells: number
  crossAxisCells: number
  lineBandCount: number
}) => {
  if (lineBandCount === 0) return undefined

  // 外側余白を揃えるには、行方向に必要な帯の合計を
  // `lineAxisAvailable - crossAxisAvailable + (crossAxisCells - lineAxisCells) * cellSize`
  // にする。半セル上限を満たすcellSizeの最大値を求める。
  const constant = lineAxisAvailable - crossAxisAvailable
  const slope = crossAxisCells - lineAxisCells
  let lower = 0
  let upper = crossAxisAvailable / crossAxisCells
  const applyLowerBound = (value: number) => { lower = Math.max(lower, value) }
  const applyUpperBound = (value: number) => { upper = Math.min(upper, value) }

  const minimumBandConstant = constant - lineBandCount * minimumLineBandSize
  if (slope > 0) applyLowerBound(-minimumBandConstant / slope)
  else if (slope < 0) applyUpperBound(-minimumBandConstant / slope)
  else if (minimumBandConstant < 0) return undefined

  const cappedSlope = slope - lineBandCount * maximumLineBandRatio
  if (cappedSlope > 0) applyUpperBound(-constant / cappedSlope)
  else if (cappedSlope < 0) applyLowerBound(-constant / cappedSlope)
  else if (constant > 0) return undefined

  return upper > 0 && lower <= upper ? upper : undefined
}

/** 正方形マスを優先し、非計数帯はセルの半分以下に保つ。 */
export const gridMetricsForFrame = ({ direction, columns, rows, verticalSpread, horizontalSpread, width, height }: GridMetricsInput): GridMetrics | undefined => {
  if (width <= 0 || height <= 0) return undefined

  const leftColumns = Math.floor(columns / 2)
  const topRows = Math.floor(rows / 2)
  const verticalBands = verticalSpread
    ? Math.max(leftColumns - 1, 0) + Math.max(columns - leftColumns - 1, 0)
    : Math.max(columns - 1, 0)
  const horizontalBands = horizontalSpread
    ? Math.max(topRows - 1, 0) + Math.max(rows - topRows - 1, 0)
    : Math.max(rows - 1, 0)
  const availableWidth = Math.max(1, width - 2)
  const availableHeight = Math.max(1, height - 2)
  const lineAxisCells = direction === 'vertical' ? columns : rows
  const crossAxisCells = direction === 'vertical' ? rows : columns
  const lineAxisAvailable = direction === 'vertical' ? availableWidth : availableHeight
  const crossAxisAvailable = direction === 'vertical' ? availableHeight : availableWidth
  const lineBands = direction === 'vertical' ? verticalBands : horizontalBands
  const hasSpine = direction === 'vertical' ? verticalSpread : horizontalSpread
  const lineBandCount = lineBands + (hasSpine ? 1 : 0)
  const maximumLineAxis = lineAxisCells + lineBandCount * maximumLineBandRatio
  const crossAxisCellSize = crossAxisAvailable / crossAxisCells
  const maximumBandCellSize = lineAxisAvailable / maximumLineAxis
  const balancedCellSize = maximumBalancedCellSize({ lineAxisAvailable, crossAxisAvailable, lineAxisCells, crossAxisCells, lineBandCount })
  const unconstrainedCellSize = Math.min(maximumBandCellSize, crossAxisCellSize)
  const canBalanceOuterMargins = balancedCellSize !== undefined && balancedCellSize <= crossAxisCellSize
  const nextCellSize = canBalanceOuterMargins ? balancedCellSize : unconstrainedCellSize
  const cellSize = Math.max(1, nextCellSize)
  const lineGapBudget = Math.max(0, lineAxisAvailable - lineAxisCells * cellSize)
  const balancedBandSize = !canBalanceOuterMargins
    ? Number.POSITIVE_INFINITY
    : Math.max(minimumLineBandSize, (lineAxisAvailable - crossAxisAvailable + (crossAxisCells - lineAxisCells) * cellSize) / lineBandCount)
  const lineBandSize = lineBandCount > 0
    ? Math.min(cellSize * maximumLineBandRatio, lineGapBudget / lineBandCount, balancedBandSize)
    : 0

  return { cellSize, lineBandSize, spineBandSize: hasSpine ? lineBandSize : 0, outerMarginsBalanced: canBalanceOuterMargins }
}
