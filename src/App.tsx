import { useEffect, useMemo, useRef, useState } from 'react'
import { copy, type Labels, type Language } from './lib/copy'
import { manuscriptCharacters, manuscriptDisplayCells, manuscriptPages, pageTotal, type Direction, type ManuscriptCell } from './lib/layout'

type Theme = 'system' | 'light' | 'dark'
type PaperId = 'b5' | 'a4'
type CompositionId = '20x20' | '20x25' | '25x20'
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
  '20x20': { characters: 20, lines: 20 },
  '20x25': { characters: 20, lines: 25 },
  '25x20': { characters: 25, lines: 20 },
}
const languageOptions = ['ja', 'system', 'en'] as const
const themeOptions = ['light', 'system', 'dark'] as const
const directionOptions = ['vertical', 'horizontal'] as const

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

function ManuscriptPage({ direction, paper, composition, cells, page, total, fontFamily, fontSize, margin, lineSpacing, letterSpacing, gridColor, showServiceMark, labels, language }: { direction: Direction; paper: PaperId; composition: CompositionId; cells: ManuscriptCell[]; page: number; total: number; fontFamily: string; fontSize: string; margin: string; lineSpacing: string; letterSpacing: string; gridColor: string; showServiceMark: boolean; labels: Labels; language: Language }) {
  const layout = compositions[composition]
  const hasText = cells.some((cell) => cell !== null)
  const paperName = papers[paper][language]
  const columns = direction === 'vertical' ? layout.lines : layout.characters
  const rows = direction === 'vertical' ? layout.characters : layout.lines
  const displayCells = manuscriptDisplayCells(cells, layout, direction)
  return <section className="paper-wrap" aria-label={labels.preview}>
    <div className="paper-meta">{paperName} / {direction === 'vertical' ? labels.vertical : labels.horizontal} / {layout.characters}{labels.characters} × {layout.lines}{labels.lines}</div>
    <div className={`paper page-${paper} direction-${direction} family-${fontFamily} font-${fontSize} margin-${margin} spacing-${lineSpacing} tracking-${letterSpacing} ${showServiceMark ? 'has-service-mark' : ''}`} style={{ '--columns': columns, '--rows': rows, '--paper-line': gridColor } as React.CSSProperties}>
      <div className="manuscript-grid" aria-label={hasText ? `${labels.sourceCount} ${manuscriptCharacters(cells.join('')).length}${labels.sourceSuffix}` : labels.blank}>{displayCells.map((cell, index) => <span key={index} className="manuscript-cell">{cell}</span>)}</div>
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
  const [composition, setComposition] = useState<CompositionId>('20x20')
  const [fontFamily, setFontFamily] = useState('mincho')
  const [fontSize, setFontSize] = useState('normal')
  const [margin, setMargin] = useState('standard')
  const [lineSpacing, setLineSpacing] = useState('standard')
  const [letterSpacing, setLetterSpacing] = useState('standard')
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
      const selectedPaper = papers[paper]
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

        <fieldset className="field-group direction-field"><legend>{labels.direction}</legend><DirectionControl value={direction} onChange={setDirection} labels={labels} /></fieldset>
        <div className="field-group"><label htmlFor="paper">{labels.paper}</label><select id="paper" value={paper} onChange={(event) => setPaper(event.target.value as PaperId)}>{Object.entries(papers).map(([id, item]) => <option key={id} value={id}>{item[language]}</option>)}</select></div>
        <div className="field-group"><label htmlFor="composition">{labels.composition}</label><select id="composition" value={composition} onChange={(event) => setComposition(event.target.value as CompositionId)}>{Object.entries(compositions).map(([id, item]) => <option key={id} value={id}>{item.characters}{labels.characters} × {item.lines}{labels.lines}</option>)}</select></div>

        <details className="optional-settings">
          <summary>{labels.details}</summary>
          <div className="detail-grid">
            <label>{labels.fontFamily}<select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}><option value="mincho">{labels.mincho}</option><option value="gothic">{labels.gothic}</option></select></label>
            <label>{labels.fontSize}<select value={fontSize} onChange={(event) => setFontSize(event.target.value)}><option value="small">{labels.small}</option><option value="normal">{labels.medium}</option><option value="large">{labels.large}</option></select></label>
            <label>{labels.margin}<select value={margin} onChange={(event) => setMargin(event.target.value)}><option value="narrow">{labels.marginNarrow}</option><option value="standard">{labels.standard}</option><option value="wide">{labels.marginWidePrint}</option></select></label>
            <label>{labels.lineSpacing}<select value={lineSpacing} onChange={(event) => setLineSpacing(event.target.value)}><option value="tight">{labels.tight}</option><option value="standard">{labels.standard}</option><option value="roomy">{labels.roomy}</option></select></label>
            <label>{labels.letterSpacing}<select value={letterSpacing} onChange={(event) => setLetterSpacing(event.target.value)}><option value="tight">{labels.tight}</option><option value="standard">{labels.standard}</option><option value="roomy">{labels.roomy}</option></select></label>
            <label>{labels.gridColor}<span className="color-control"><input aria-label={labels.gridColor} type="color" value={gridColor} onChange={(event) => setGridColor(event.target.value)} /><output>{gridColor}</output></span></label>
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
        <div className="preview-capture" ref={previewRef}>{pages.map((cells, index) => <ManuscriptPage key={index} direction={direction} paper={paper} composition={composition} cells={cells} page={index + 1} total={pages.length} fontFamily={fontFamily} fontSize={fontSize} margin={margin} lineSpacing={lineSpacing} letterSpacing={letterSpacing} gridColor={gridColor} showServiceMark={showServiceMark} labels={labels} language={language} />)}</div>
      </section>
    </div>

    {status && <div className={`toast ${status.tone}`} role="status"><span>{status.message}</span>{status.tone === 'error' && <button type="button" className="toast-retry" onClick={savePdf}>{labels.retry}</button>}<button type="button" aria-label={labels.close} onClick={() => setStatus(null)}>×</button></div>}
  </main>
}
