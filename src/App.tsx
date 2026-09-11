import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { copy, type Labels, type Language } from './lib/copy'
import { manuscriptCharacters, manuscriptDisplayCells, manuscriptPages, pageTotal, type Direction, type ManuscriptCell } from './lib/layout'

type Theme = 'system' | 'light' | 'dark'
type PaperId = 'b5' | 'a4'
type PaperOrientation = 'portrait' | 'landscape'
type CompositionId = '10x20' | '14x14' | '16x25' | '20x10' | '20x20' | '20x25' | '25x16' | '25x20' | '30x40' | '40x30' | '40x40'
type Status = { tone: 'success' | 'error'; message: string } | null
type LanguagePreference = Language | 'system'

const defaultLanguage = (): Language => {
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const locale of locales) {
    const normalized = locale.toLowerCase()
    if (normalized === 'ja' || normalized.startsWith('ja-')) return 'ja'
    if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  }
  return 'ja'
}

const papers: Record<PaperId, { ja: string; en: string; width: number; height: number }> = {
  b5: { ja: 'B5（182 × 257 mm）', en: 'B5 (182 × 257 mm)', width: 182, height: 257 },
  a4: { ja: 'A4（210 × 297 mm）', en: 'A4 (210 × 297 mm)', width: 210, height: 297 },
}

const compositions: Record<CompositionId, { characters: number; lines: number }> = {
  '10x20': { characters: 10, lines: 20 },
  '14x14': { characters: 14, lines: 14 },
  '20x10': { characters: 20, lines: 10 },
  '20x20': { characters: 20, lines: 20 },
  '16x25': { characters: 16, lines: 25 },
  '25x16': { characters: 25, lines: 16 },
  '20x25': { characters: 20, lines: 25 },
  '25x20': { characters: 25, lines: 20 },
  '30x40': { characters: 30, lines: 40 },
  '40x30': { characters: 40, lines: 30 },
  '40x40': { characters: 40, lines: 40 },
}
const languageOptions = ['ja', 'system', 'en'] as const
const themeOptions = ['light', 'system', 'dark'] as const
const directionOptions = ['vertical', 'horizontal'] as const
const paperOrientationOptions = ['portrait', 'landscape'] as const

function stored<T>(key: string, fallback: T): T {
  try { return (localStorage.getItem(key) as T) || fallback } catch { return fallback }
}

function initialLanguagePreference(): LanguagePreference {
  const preference = stored<string>('kantan:language-preference', '')
  if (preference === 'ja' || preference === 'en' || preference === 'system') return preference
  const legacyLanguage = stored<string>('kantan:language', '')
  return legacyLanguage === 'ja' || legacyLanguage === 'en' ? legacyLanguage : 'system'
}

function InfoButton({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(false)
  return <span className="info-wrap">
    <button type="button" className="info-button" aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}>i</button>
    {open && <span role="status" className="info-popover">{content}</span>}
  </span>
}

function DirectionControl({ value, onChange, labels }: { value: Direction; onChange: (direction: Direction) => void; labels: Labels }) {
  return <div className="segmented" role="radiogroup" aria-label={labels.direction}>
    {directionOptions.map((direction) => <button key={direction} type="button" role="radio" tabIndex={value === direction ? 0 : -1} aria-checked={value === direction} className={value === direction ? 'selected' : ''} onClick={() => onChange(direction)} onKeyDown={(event) => moveRadio(event, directionOptions, value, onChange)}>
      {direction === 'vertical' ? labels.vertical : labels.horizontal}
    </button>)}
  </div>
}

function PaperOrientationControl({ value, onChange, labels, labelId }: { value: PaperOrientation; onChange: (orientation: PaperOrientation) => void; labels: Labels; labelId: string }) {
  return <div className="paper-orientation" role="radiogroup" aria-labelledby={labelId}>
    {paperOrientationOptions.map((orientation) => <button key={orientation} type="button" role="radio" tabIndex={value === orientation ? 0 : -1} aria-checked={value === orientation} className={value === orientation ? 'selected' : ''} onClick={() => onChange(orientation)} onKeyDown={(event) => moveRadio(event, paperOrientationOptions, value, onChange)}>
      {orientation === 'portrait' ? labels.portrait : labels.landscape}
    </button>)}
  </div>
}

function moveRadio<T extends string>(event: React.KeyboardEvent<HTMLButtonElement>, options: readonly T[], value: T, onChange: (value: T) => void) {
  const current = options.indexOf(value)
  const next = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (current + options.length - 1) % options.length
    : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (current + 1) % options.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : null
  if (next === null) return
  event.preventDefault()
  onChange(options[next])
  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
}

const lineBandRatio = 0.16
const spineBandRatio = 1.2

function compositionLabel(layout: { characters: number; lines: number }, labels: Labels, language: Language) {
  const capacity = layout.characters * layout.lines
  return language === 'ja'
    ? `${layout.characters}${labels.characters} × ${layout.lines}${labels.lines}（${capacity}字詰め）`
    : `${layout.characters} ${labels.characters} × ${layout.lines} ${labels.lines} (${capacity}-character grid)`
}

function useGridMetrics({ direction, columns, rows, verticalSpread, horizontalSpread }: { direction: Direction; columns: number; rows: number; verticalSpread: boolean; horizontalSpread: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(1)

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const update = () => {
      const width = frame.clientWidth
      const height = frame.clientHeight
      if (width === 0 || height === 0) return
      const leftColumns = Math.floor(columns / 2)
      const topRows = Math.floor(rows / 2)
      const verticalBands = verticalSpread
        ? Math.max(leftColumns - 1, 0) + Math.max(columns - leftColumns - 1, 0)
        : Math.max(columns - 1, 0)
      const horizontalBands = horizontalSpread
        ? Math.max(topRows - 1, 0) + Math.max(rows - topRows - 1, 0)
        : Math.max(rows - 1, 0)
      const fitCellSize = (available: number, cells: number, bands: number, hasSpine: boolean) => {
        let lower = 0
        let upper = available
        for (let index = 0; index < 32; index += 1) {
          const candidate = (lower + upper) / 2
          const used = cells * candidate + bands * Math.max(1, candidate * lineBandRatio) + (hasSpine ? Math.max(1, candidate * spineBandRatio) : 0)
          if (used <= available) lower = candidate
          else upper = candidate
        }
        return lower
      }
      const widthSize = direction === 'vertical'
        ? fitCellSize(width - 2, columns, verticalBands, verticalSpread)
        : (width - 2) / columns
      const heightSize = direction === 'horizontal'
        ? fitCellSize(height - 2, rows, horizontalBands, horizontalSpread)
        : (height - 2) / rows
      const nextSize = Math.max(1, Math.floor(Math.min(widthSize, heightSize) * 100) / 100)
      setCellSize((current) => Math.abs(current - nextSize) < 0.01 ? current : nextSize)
    }

    let animationFrame = 0
    const schedule = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(update)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(frame)
    window.addEventListener('beforeprint', schedule)
    window.addEventListener('afterprint', schedule)
    schedule()
    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer.disconnect()
      window.removeEventListener('beforeprint', schedule)
      window.removeEventListener('afterprint', schedule)
    }
  }, [columns, direction, horizontalSpread, rows, verticalSpread])

  return {
    frameRef,
    style: {
      '--cell-size': `${cellSize}px`,
      '--line-band-size': `${Math.max(1, cellSize * lineBandRatio)}px`,
      '--spine-band-size': `${Math.max(1, cellSize * spineBandRatio)}px`,
    } as React.CSSProperties,
  }
}

function LanguageToggle({ value, onChange, labels }: { value: LanguagePreference; onChange: (language: LanguagePreference) => void; labels: Labels }) {
  return <div className={`language-toggle mode-${value}`} role="radiogroup" aria-label={labels.language}>
    <span className="language-indicator" aria-hidden="true" />
    {languageOptions.map((option) => <button key={option} type="button" role="radio" tabIndex={value === option ? 0 : -1} aria-checked={value === option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)} onKeyDown={(event) => moveRadio(event, languageOptions, value, onChange)}>
      {option === 'ja' ? labels.japanese : option === 'system' ? labels.system : labels.english}
    </button>)}
  </div>
}

function ThemeToggle({ value, onChange, labels }: { value: Theme; onChange: (theme: Theme) => void; labels: Labels }) {
  return <div className={`theme-toggle mode-${value}`} role="radiogroup" aria-label={labels.appearance}>
    <span className="theme-indicator" aria-hidden="true" />
    {themeOptions.map((option) => <button key={option} type="button" role="radio" tabIndex={value === option ? 0 : -1} aria-checked={value === option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)} onKeyDown={(event) => moveRadio(event, themeOptions, value, onChange)}>
      {option === 'light' ? labels.light : option === 'system' ? labels.system : labels.dark}
    </button>)}
  </div>
}

function ManuscriptPage({ direction, paper, paperOrientation, composition, cells, page, total, fontFamily, fontSize, margin, gridColor, showServiceMark, labels, language }: { direction: Direction; paper: PaperId; paperOrientation: PaperOrientation; composition: CompositionId; cells: ManuscriptCell[]; page: number; total: number; fontFamily: string; fontSize: string; margin: string; gridColor: string; showServiceMark: boolean; labels: Labels; language: Language }) {
  const layout = compositions[composition]
  const hasText = cells.some((cell) => cell !== null)
  const paperName = papers[paper][language]
  const paperDimensions = paperOrientation === 'landscape' ? { width: papers[paper].height, height: papers[paper].width } : papers[paper]
  const columns = direction === 'vertical' ? layout.lines : layout.characters
  const rows = direction === 'vertical' ? layout.characters : layout.lines
  const displayCells = manuscriptDisplayCells(cells, layout, direction)
  const leftColumns = Math.floor(layout.lines / 2)
  const verticalRows = Array.from({ length: layout.characters }, (_, row) => displayCells.slice(row * layout.lines, (row + 1) * layout.lines))
  const leftCells = verticalRows.flatMap((row) => row.slice(0, leftColumns))
  const rightCells = verticalRows.flatMap((row) => row.slice(leftColumns))
  const topRows = Math.floor(layout.lines / 2)
  const topCells = displayCells.slice(0, topRows * layout.characters)
  const bottomCells = displayCells.slice(topRows * layout.characters)
  const verticalSpread = direction === 'vertical' && paperOrientation === 'landscape'
  const horizontalSpread = direction === 'horizontal' && paperOrientation === 'portrait'
  const gridMetrics = useGridMetrics({ direction, columns, rows, verticalSpread, horizontalSpread })
  return <section className="paper-wrap" aria-label={labels.preview}>
    <div className="paper-meta">{paperName} / {direction === 'vertical' ? labels.vertical : labels.horizontal} / {paperOrientation === 'portrait' ? labels.portrait : labels.landscape} / {compositionLabel(layout, labels, language)}</div>
    <div className={`paper page-${paper} orientation-${paperOrientation} direction-${direction} family-${fontFamily} font-${fontSize} margin-${margin} ${showServiceMark ? 'has-service-mark' : ''}`} style={{ '--columns': columns, '--rows': rows, '--paper-line': gridColor, '--paper-width': paperDimensions.width, '--paper-height': paperDimensions.height, ...gridMetrics.style } as React.CSSProperties}>
      <div className="manuscript-grid-frame" ref={gridMetrics.frameRef}>
        {verticalSpread
          ? <div className="manuscript-grid vertical-manuscript-grid" aria-label={hasText ? `${labels.sourceCount} ${manuscriptCharacters(cells.join('')).length}${labels.sourceSuffix}` : labels.blank}>
            <div className="manuscript-half" style={{ '--half-columns': leftColumns, '--rows': rows } as React.CSSProperties}>{leftCells.map((cell, index) => <span key={index} className="manuscript-cell">{cell}</span>)}</div>
            <div className="manuscript-spine" aria-hidden="true">
              <svg className="fish-tail" viewBox="0 0 20 10" focusable="false"><path d="M1 1h18v7C14.5 4.8 5.5 4.8 1 8Z" /></svg>
              <span className="spine-guide" />
            </div>
            <div className="manuscript-half" style={{ '--half-columns': layout.lines - leftColumns, '--rows': rows } as React.CSSProperties}>{rightCells.map((cell, index) => <span key={index} className="manuscript-cell">{cell}</span>)}</div>
            </div>
          : horizontalSpread
            ? <div className="manuscript-grid horizontal-manuscript-grid" aria-label={hasText ? `${labels.sourceCount} ${manuscriptCharacters(cells.join('')).length}${labels.sourceSuffix}` : labels.blank}>
              <div className="manuscript-half horizontal-manuscript-half" style={{ '--columns': layout.characters, '--half-rows': topRows } as React.CSSProperties}>{topCells.map((cell, index) => <span key={index} className="manuscript-cell">{cell}</span>)}</div>
              <div className="manuscript-spine horizontal-manuscript-spine" aria-hidden="true" />
              <div className="manuscript-half horizontal-manuscript-half" style={{ '--columns': layout.characters, '--half-rows': layout.lines - topRows } as React.CSSProperties}>{bottomCells.map((cell, index) => <span key={index} className="manuscript-cell">{cell}</span>)}</div>
              </div>
            : <div className="manuscript-grid" aria-label={hasText ? `${labels.sourceCount} ${manuscriptCharacters(cells.join('')).length}${labels.sourceSuffix}` : labels.blank}>{displayCells.map((cell, index) => <span key={index} className="manuscript-cell">{cell}</span>)}</div>}
      </div>
      {!hasText && <p className="empty-paper">{labels.blank}</p>}
      {showServiceMark && <span className="service-mark" aria-hidden="true">{labels.serviceName}</span>}
    </div>
    <div className="page-footer">{labels.page} {page} / {total}</div>
  </section>
}

export default function App() {
  const [languagePreference, setLanguagePreference] = useState<LanguagePreference>(initialLanguagePreference)
  const [theme, setTheme] = useState<Theme>(() => stored('kantan:theme', 'system'))
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [text, setText] = useState('')
  const [direction, setDirection] = useState<Direction>('vertical')
  const [paper, setPaper] = useState<PaperId>('b5')
  const [paperOrientation, setPaperOrientation] = useState<PaperOrientation>('landscape')
  const [composition, setComposition] = useState<CompositionId>('20x20')
  const [fontFamily, setFontFamily] = useState('mincho')
  const [fontSize, setFontSize] = useState('normal')
  const [margin, setMargin] = useState('standard')
  const [gridColor, setGridColor] = useState('#c9ad97')
  const [autoParagraphIndent, setAutoParagraphIndent] = useState(true)
  const [showServiceMark, setShowServiceMark] = useState(true)
  const [pending, setPending] = useState<'pdf' | 'print' | null>(null)
  const [status, setStatus] = useState<Status>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const language = languagePreference === 'system' ? defaultLanguage() : languagePreference
  const labels: Labels = copy[language]
  const sourceCharacters = useMemo(() => manuscriptCharacters(text).length, [text])
  const layoutOptions = useMemo(() => ({ autoParagraphIndent }), [autoParagraphIndent])
  const totalPages = useMemo(() => pageTotal(text, compositions[composition], layoutOptions), [text, composition, layoutOptions])
  const pages = useMemo(() => manuscriptPages(text, compositions[composition], layoutOptions), [text, composition, layoutOptions])

  const selectDirection = (nextDirection: Direction) => {
    setDirection(nextDirection)
    setPaperOrientation(nextDirection === 'vertical' ? 'landscape' : 'portrait')
  }

  useEffect(() => {
    localStorage.setItem('kantan:language-preference', languagePreference)
    if (languagePreference !== 'system') localStorage.setItem('kantan:language', languagePreference)
    document.documentElement.lang = language
  }, [language, languagePreference])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = () => setSystemDark(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateSystemTheme)
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  useEffect(() => {
    localStorage.setItem('kantan:theme', theme)
    document.documentElement.dataset.theme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
  }, [systemDark, theme])

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(null), 4500)
    return () => window.clearTimeout(timer)
  }, [status])

  const savePdf = async () => {
    if (!previewRef.current || pending) return
    setPending('pdf')
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
      const selectedPaper = paperOrientation === 'landscape' ? { width: papers[paper].height, height: papers[paper].width } : papers[paper]
      const doc = new jsPDF({ orientation: selectedPaper.width > selectedPaper.height ? 'landscape' : 'portrait', unit: 'mm', format: [selectedPaper.width, selectedPaper.height] })
      const paperElements = Array.from(previewRef.current.querySelectorAll<HTMLElement>('.paper'))
      for (const [index, paperElement] of paperElements.entries()) {
        const canvas = await html2canvas(paperElement, { backgroundColor: '#ffffff', scale: 2, useCORS: true })
        if (index > 0) doc.addPage([selectedPaper.width, selectedPaper.height])
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, selectedPaper.width, selectedPaper.height)
      }
      doc.save(`kantan-${paper}-${direction}.pdf`)
      setStatus({ tone: 'success', message: labels.pdfReady })
    } catch {
      setStatus({ tone: 'error', message: labels.pdfError })
    } finally {
      setPending(null)
    }
  }

  const print = () => {
    if (pending) return
    setPending('print')
    window.setTimeout(() => {
      window.print()
      setPending(null)
      setStatus({ tone: 'success', message: labels.printReady })
    }, 80)
  }

  return <main className="app-shell">
    <header className="site-header">
      <a className="brand" href="/" aria-label="kantan home">kantan</a>
      <div className="header-preferences">
        <LanguageToggle value={languagePreference} onChange={setLanguagePreference} labels={labels} />
        <ThemeToggle value={theme} onChange={setTheme} labels={labels} />
      </div>
    </header>

    <div className="workspace">
      <section className="editor" aria-label={labels.body}>
        <div className="field-group text-field">
          <label htmlFor="source-text">{labels.body}</label>
          <textarea id="source-text" value={text} onChange={(event) => setText(event.target.value)} placeholder={labels.hint} spellCheck="false" />
          <p className="source-count" aria-live="polite">{labels.sourceCount} {sourceCharacters}{language === 'ja' ? labels.sourceSuffix : ` ${labels.sourceSuffix}`} / {totalPages} {labels.pages}</p>
        </div>

        <fieldset className="field-group direction-field"><legend>{labels.direction}</legend><DirectionControl value={direction} onChange={selectDirection} labels={labels} /></fieldset>
        <div className="field-group"><label htmlFor="paper">{labels.paper}</label><select id="paper" value={paper} onChange={(event) => setPaper(event.target.value as PaperId)}>{Object.entries(papers).map(([id, item]) => <option key={id} value={id}>{item[language]}</option>)}</select></div>
        <div className="field-group"><label htmlFor="composition">{labels.composition}</label><select id="composition" value={composition} onChange={(event) => setComposition(event.target.value as CompositionId)}>{Object.entries(compositions).map(([id, item]) => <option key={id} value={id}>{compositionLabel(item, labels, language)}</option>)}</select></div>

        <details className="optional-settings">
          <summary>{labels.details}</summary>
          <div className="detail-grid">
            <label>{labels.fontFamily}<select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}><option value="mincho">{labels.mincho}</option><option value="gothic">{labels.gothic}</option></select></label>
            <label>{labels.fontSize}<select value={fontSize} onChange={(event) => setFontSize(event.target.value)}><option value="small">{labels.small}</option><option value="normal">{labels.medium}</option><option value="large">{labels.large}</option></select></label>
            <label>{labels.margin}<select value={margin} onChange={(event) => setMargin(event.target.value)}><option value="narrow">{labels.marginNarrow}</option><option value="standard">{labels.standard}</option><option value="wide">{labels.marginWidePrint}</option></select></label>
            <label>{labels.gridColor}<span className="color-control"><input aria-label={labels.gridColor} type="color" value={gridColor} onChange={(event) => setGridColor(event.target.value)} /><output>{gridColor}</output></span></label>
            <div className="paper-orientation-control"><span id="paper-orientation-label">{labels.paperOrientation}</span><PaperOrientationControl value={paperOrientation} onChange={setPaperOrientation} labels={labels} labelId="paper-orientation-label" /></div>
            <label className="mark-control"><input type="checkbox" checked={autoParagraphIndent} onChange={(event) => setAutoParagraphIndent(event.target.checked)} /><span>{labels.paragraphIndent}</span></label>
            <label className="mark-control"><input type="checkbox" checked={showServiceMark} onChange={(event) => setShowServiceMark(event.target.checked)} /><span>{labels.serviceMark}</span></label>
          </div>
        </details>

        <div className="action-group">
          <button type="button" className="button primary" disabled={pending !== null} aria-busy={pending === 'pdf'} onClick={savePdf}>{pending === 'pdf' ? labels.saving : labels.save}</button>
          <button type="button" className="button secondary" disabled={pending !== null} aria-busy={pending === 'print'} onClick={print}>{pending === 'print' ? labels.printing : labels.print}</button>
        </div>
      </section>

      <section className="preview-panel" aria-label={labels.preview}>
        <div className="preview-heading"><h1>{labels.preview}</h1><InfoButton label={labels.info} content={labels.settingsInfo} /></div>
        <div className="preview-capture" ref={previewRef}>{pages.map((cells, index) => <ManuscriptPage key={index} direction={direction} paper={paper} paperOrientation={paperOrientation} composition={composition} cells={cells} page={index + 1} total={pages.length} fontFamily={fontFamily} fontSize={fontSize} margin={margin} gridColor={gridColor} showServiceMark={showServiceMark} labels={labels} language={language} />)}</div>
      </section>
    </div>

    <footer className="site-footer">
      <span>{labels.copyright}</span>
      <a href={`mailto:${labels.contact}`}>{labels.contact}</a>
    </footer>

    {status && <div className={`toast ${status.tone}`} role="status"><span>{status.message}</span>{status.tone === 'error' && <button type="button" className="toast-retry" onClick={savePdf}>{labels.retry}</button>}<button type="button" aria-label={labels.close} onClick={() => setStatus(null)}>×</button></div>}
  </main>
}
