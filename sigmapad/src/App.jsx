import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import './App.css'

/* ═══════════════════════════════════════════════
   THEME CONTEXT
   ═══════════════════════════════════════════════ */
const ThemeContext = createContext()

function useTheme() {
  return useContext(ThemeContext)
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('sigmapad-theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('sigmapad-theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/* ─── Theme Toggle Button ─── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

/* ═══════════════════════════════════════════════
   STOCK TICKER BAR
   ═══════════════════════════════════════════════ */
function StockTicker() {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)

  const symbols = [
    { key: 'gold', label: 'Gold', symbol: 'GC=F' },
    { key: 'silver', label: 'Silver', symbol: 'SI=F' },
    { key: 'nifty50', label: 'NIFTY 50', symbol: '^NSEI' },
    { key: 'sp500', label: 'S&P 500', symbol: '^GSPC' },
    { key: 'hsi', label: 'HSI', symbol: '^HSI' },
  ]

  const fetchPrices = useCallback(async () => {
    try {
      const results = {}

      // Fetch all symbols via Yahoo Finance v8 chart endpoint
      const allSymbols = symbols.map((s) => s.symbol).join(',')

      // Try batch approach first, fall back to individual
      try {
        const promises = symbols.map(async ({ key, symbol }) => {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          )
          if (res.ok) {
            const data = await res.json()
            const meta = data.chart?.result?.[0]?.meta
            if (meta) {
              results[key] = {
                price: meta.regularMarketPrice,
                prevClose: meta.chartPreviousClose ?? meta.previousClose,
              }
            }
          }
        })
        await Promise.allSettled(promises)
      } catch {
        // If Yahoo Finance is blocked, use fallback demo data
        useFallbackData(results)
      }

      // If no results at all, use fallback
      if (Object.keys(results).length === 0) {
        useFallbackData(results)
      }

      setPrices(results)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  const useFallbackData = (results) => {
    // Simulated data with slight randomization for demo
    const base = {
      gold: { price: 2650 + Math.random() * 30, prevClose: 2645 },
      silver: { price: 31.2 + Math.random() * 0.5, prevClose: 31.0 },
      nifty50: { price: 23400 + Math.random() * 200, prevClose: 23350 },
      sp500: { price: 5850 + Math.random() * 50, prevClose: 5830 },
      hsi: { price: 20100 + Math.random() * 200, prevClose: 20050 },
    }
    Object.assign(results, base)
  }

  useEffect(() => {
    fetchPrices()
    const id = setInterval(fetchPrices, 30000)
    return () => clearInterval(id)
  }, [fetchPrices])

  const format = (data) => {
    if (!data?.price) return '—'
    return data.price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const changeInfo = (data) => {
    if (!data?.price || !data?.prevClose) return { text: '', cls: '' }
    const diff = data.price - data.prevClose
    const pct = ((diff / data.prevClose) * 100).toFixed(2)
    return {
      text: diff >= 0 ? `+${pct}%` : `${pct}%`,
      cls: diff >= 0 ? 'ticker-up' : 'ticker-down',
    }
  }

  return (
    <div className="stock-ticker">
      {loading && <span className="ticker-loading">Loading market data…</span>}
      {!loading &&
        symbols.map(({ key, label }) => {
          const data = prices[key]
          const chg = changeInfo(data)
          return (
            <div key={key} className="ticker-item">
              <span className="ticker-label">{label}:</span>
              <span className="ticker-price">{format(data)}</span>
              {chg.text && (
                <span className={`ticker-change ${chg.cls}`}>{chg.text}</span>
              )}
            </div>
          )
        })}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   CALCULATOR (Stack-based evaluation)
   ═══════════════════════════════════════════════ */

// Format number: strip trailing precision noise
function formatNum(n) {
  if (!Number.isFinite(n)) return 'Error'
  return parseFloat(n.toPrecision(12)).toString()
}

// Operator precedence: ×, ÷ are higher than +, −
const PRECEDENCE = { '+': 1, '−': 1, '×': 2, '÷': 2, '**': 3 }

function applyOp(a, op, b) {
  switch (op) {
    case '+': return a + b
    case '−': return a - b
    case '×': return a * b
    case '÷': return b === 0 ? NaN : a / b
    case '**': return Math.pow(a, b)
    default: return b
  }
}

// Evaluate a token list [num, op, num, op, num, ...] respecting precedence
function evaluateTokens(tokens) {
  if (tokens.length === 0) return 0
  if (tokens.length === 1) return tokens[0]

  // Shunting-yard style: two stacks
  const values = []
  const ops = []

  const applyTop = () => {
    const b = values.pop()
    const a = values.pop()
    const op = ops.pop()
    values.push(applyOp(a, op, b))
  }

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]
    if (typeof tok === 'number') {
      values.push(tok)
    } else {
      // It's an operator
      while (
        ops.length > 0 &&
        (PRECEDENCE[ops[ops.length - 1]] || 0) >= (PRECEDENCE[tok] || 0)
      ) {
        applyTop()
      }
      ops.push(tok)
    }
  }

  while (ops.length > 0) {
    applyTop()
  }

  return values[0]
}

function Calculator({ isScientific, setIsScientific }) {
  // Stack-based state: tokens holds [num, op, num, op, ...] history
  const [tokens, setTokens] = useState([])       // completed tokens: [20, '+', 10, '+']
  const [display, setDisplay] = useState('0')     // current number being typed
  const [memory, setMemory] = useState(0)
  const [justEvaluated, setJustEvaluated] = useState(false)
  const [angleMode, setAngleMode] = useState('deg')

  // Build expression string for the display line
  const expressionStr = tokens.length > 0
    ? tokens.map((t) => (typeof t === 'number' ? formatNum(t) : ` ${t} `)).join('')
    : ''

  const toRad = (v) => (angleMode === 'deg' ? (v * Math.PI) / 180 : v)
  const fromRad = (v) => (angleMode === 'deg' ? (v * 180) / Math.PI : v)

  const handleNumber = (num) => {
    if (justEvaluated) {
      setDisplay(num)
      setTokens([])
      setJustEvaluated(false)
    } else {
      setDisplay((d) => (d === '0' ? num : d + num))
    }
  }

  const handleOperator = (op) => {
    const currentVal = parseFloat(display) || 0

    if (justEvaluated) {
      // After pressing =, start a new chain from the result
      setTokens([currentVal, op])
      setDisplay('0')
      setJustEvaluated(false)
    } else {
      // Append current value and operator to the token stack
      setTokens((prev) => [...prev, currentVal, op])
      setDisplay('0')
    }
  }

  const handleEquals = () => {
    try {
      const currentVal = parseFloat(display) || 0
      const allTokens = [...tokens, currentVal]
      const result = evaluateTokens(allTokens)

      setDisplay(
        Number.isFinite(result)
          ? formatNum(result)
          : 'Error'
      )
      setTokens([])
      setJustEvaluated(true)
    } catch {
      setDisplay('Error')
      setTokens([])
      setJustEvaluated(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setTokens([])
    setJustEvaluated(false)
  }

  const handleBackspace = () => {
    if (justEvaluated) return
    setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'))
  }

  const handleDecimal = () => {
    if (justEvaluated) {
      setDisplay('0.')
      setTokens([])
      setJustEvaluated(false)
    } else if (!display.includes('.')) {
      setDisplay((d) => d + '.')
    }
  }

  const handlePercent = () => {
    setDisplay((d) => formatNum(parseFloat(d) / 100))
  }

  const handleNegate = () => {
    setDisplay((d) => (d.startsWith('-') ? d.slice(1) : d !== '0' ? '-' + d : d))
  }

  const factorial = (n) => {
    if (n < 0 || !Number.isInteger(n)) return NaN
    if (n === 0 || n === 1) return 1
    if (n > 170) return Infinity
    let r = 1
    for (let i = 2; i <= n; i++) r *= i
    return r
  }

  const handleScientific = (fn) => {
    try {
      const val = parseFloat(display)
      let result
      switch (fn) {
        case 'sin': result = Math.sin(toRad(val)); break
        case 'cos': result = Math.cos(toRad(val)); break
        case 'tan': result = Math.tan(toRad(val)); break
        case 'asin': result = fromRad(Math.asin(val)); break
        case 'acos': result = fromRad(Math.acos(val)); break
        case 'atan': result = fromRad(Math.atan(val)); break
        case 'log': result = Math.log10(val); break
        case 'ln': result = Math.log(val); break
        case 'sqrt': result = Math.sqrt(val); break
        case 'cbrt': result = Math.cbrt(val); break
        case 'x2': result = val * val; break
        case 'x3': result = val * val * val; break
        case '1/x': result = 1 / val; break
        case 'exp': result = Math.exp(val); break
        case 'fact': result = factorial(Math.floor(val)); break
        case 'abs': result = Math.abs(val); break
        case '10x': result = Math.pow(10, val); break
        default: result = val
      }
      setDisplay(
        Number.isFinite(result)
          ? formatNum(result)
          : 'Error'
      )
      setJustEvaluated(true)
    } catch {
      setDisplay('Error')
    }
  }

  const handleMemory = (op) => {
    const val = parseFloat(display) || 0
    switch (op) {
      case 'MC': setMemory(0); break
      case 'MR': setDisplay(memory.toString()); setJustEvaluated(true); break
      case 'M+': setMemory((m) => m + val); break
      case 'M-': setMemory((m) => m - val); break
    }
  }

  const handleConstant = (c) => {
    setDisplay(c === 'pi' ? String(Math.PI) : String(Math.E))
    setJustEvaluated(true)
  }

  const handlePower = () => {
    const currentVal = parseFloat(display) || 0
    if (justEvaluated) {
      setTokens([currentVal, '**'])
      setJustEvaluated(false)
    } else {
      setTokens((prev) => [...prev, currentVal, '**'])
    }
    setDisplay('0')
  }

  const handleParen = (p) => {
    // For scientific mode: append parens to current display string
    if (justEvaluated && p === '(') {
      setDisplay(p)
      setTokens([])
      setJustEvaluated(false)
    } else {
      setDisplay((d) => (d === '0' ? p : d + p))
    }
  }

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return

      const k = e.key
      if (k >= '0' && k <= '9') handleNumber(k)
      else if (k === '.') handleDecimal()
      else if (k === '+') handleOperator('+')
      else if (k === '-') handleOperator('−')
      else if (k === '*') handleOperator('×')
      else if (k === '/') { e.preventDefault(); handleOperator('÷') }
      else if (k === 'Enter' || k === '=') handleEquals()
      else if (k === 'Escape') handleClear()
      else if (k === 'Backspace') handleBackspace()
      else if (k === '%') handlePercent()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className="calculator">
      <div className="calc-display-area">
        <div className="calc-expression">{expressionStr || '\u00A0'}</div>
        <div className="calc-display-row">
          <div className="calc-display">{display}</div>
          <button className="calc-backspace" onClick={handleBackspace} title="Backspace" aria-label="Backspace">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="calc-mode-bar">
        <button
          className={`mode-btn ${!isScientific ? 'active' : ''}`}
          onClick={() => setIsScientific(false)}
        >
          Basic
        </button>
        <button
          className={`mode-btn ${isScientific ? 'active' : ''}`}
          onClick={() => setIsScientific(true)}
        >
          Scientific
        </button>
        {isScientific && (
          <button
            className="mode-btn angle-btn"
            onClick={() => setAngleMode((m) => (m === 'deg' ? 'rad' : 'deg'))}
          >
            {angleMode.toUpperCase()}
          </button>
        )}
      </div>

      {isScientific && (
        <div className="calc-scientific-buttons">
          <button onClick={() => handleMemory('MC')}>MC</button>
          <button onClick={() => handleMemory('MR')}>MR</button>
          <button onClick={() => handleMemory('M+')}>M+</button>
          <button onClick={() => handleMemory('M-')}>M-</button>

          <button onClick={() => handleScientific('sin')}>sin</button>
          <button onClick={() => handleScientific('cos')}>cos</button>
          <button onClick={() => handleScientific('tan')}>tan</button>
          <button onClick={() => handleScientific('log')}>log</button>

          <button onClick={() => handleScientific('asin')}>sin⁻¹</button>
          <button onClick={() => handleScientific('acos')}>cos⁻¹</button>
          <button onClick={() => handleScientific('atan')}>tan⁻¹</button>
          <button onClick={() => handleScientific('ln')}>ln</button>

          <button onClick={() => handleScientific('sqrt')}>√x</button>
          <button onClick={() => handleScientific('cbrt')}>∛x</button>
          <button onClick={() => handleScientific('x2')}>x²</button>
          <button onClick={() => handleScientific('x3')}>x³</button>

          <button onClick={handlePower}>xʸ</button>
          <button onClick={() => handleScientific('10x')}>10ˣ</button>
          <button onClick={() => handleScientific('exp')}>eˣ</button>
          <button onClick={() => handleScientific('fact')}>x!</button>

          <button onClick={() => handleConstant('pi')}>π</button>
          <button onClick={() => handleConstant('e')}>e</button>
          <button onClick={() => handleScientific('1/x')}>1/x</button>
          <button onClick={() => handleScientific('abs')}>|x|</button>

          <button onClick={() => handleParen('(')}>(</button>
          <button onClick={() => handleParen(')')}>)</button>
        </div>
      )}

      <div className="calc-basic-buttons">
        <button className="btn-func" onClick={handleClear}>AC</button>
        <button className="btn-func" onClick={handleNegate}>±</button>
        <button className="btn-func" onClick={handlePercent}>%</button>
        <button className="btn-op" onClick={() => handleOperator('÷')}>÷</button>

        <button className="btn-num" onClick={() => handleNumber('7')}>7</button>
        <button className="btn-num" onClick={() => handleNumber('8')}>8</button>
        <button className="btn-num" onClick={() => handleNumber('9')}>9</button>
        <button className="btn-op" onClick={() => handleOperator('×')}>×</button>

        <button className="btn-num" onClick={() => handleNumber('4')}>4</button>
        <button className="btn-num" onClick={() => handleNumber('5')}>5</button>
        <button className="btn-num" onClick={() => handleNumber('6')}>6</button>
        <button className="btn-op" onClick={() => handleOperator('−')}>−</button>

        <button className="btn-num" onClick={() => handleNumber('1')}>1</button>
        <button className="btn-num" onClick={() => handleNumber('2')}>2</button>
        <button className="btn-num" onClick={() => handleNumber('3')}>3</button>
        <button className="btn-op" onClick={() => handleOperator('+')}>+</button>

        <button className="btn-num btn-zero" onClick={() => handleNumber('0')}>0</button>
        <button className="btn-num" onClick={handleDecimal}>.</button>
        <button className="btn-eq" onClick={handleEquals}>=</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SCRATCH PAD
   ═══════════════════════════════════════════════ */
function ScratchPad() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [mode, setMode] = useState('draw')
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#e0e0e0')
  const [lineWidth, setLineWidth] = useState(2)
  const [text, setText] = useState('')
  const lastPos = useRef(null)

  // Canvas resize handler
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      // Save existing drawing
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      tempCanvas.getContext('2d').drawImage(canvas, 0, 0)

      canvas.width = rect.width
      canvas.height = rect.height

      // Restore drawing
      canvas.getContext('2d').drawImage(tempCanvas, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [mode])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const startDraw = (e) => {
    if (mode !== 'draw') return
    e.preventDefault()
    setIsDrawing(true)
    lastPos.current = getPos(e)
  }

  const draw = (e) => {
    if (!isDrawing || mode !== 'draw') return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    lastPos.current = pos
  }

  const endDraw = () => {
    setIsDrawing(false)
    lastPos.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setText('')
  }

  const colors = ['#e0e0e0', '#ff6b6b', '#51cf66', '#339af0', '#fcc419', '#cc5de8']

  return (
    <div className="scratch-pad">
      <div className="pad-toolbar">
        <div className="pad-mode-toggle">
          <button
            className={`pad-mode-btn ${mode === 'draw' ? 'active' : ''}`}
            onClick={() => setMode('draw')}
            title="Draw mode (pen/touch)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
          <button
            className={`pad-mode-btn ${mode === 'type' ? 'active' : ''}`}
            onClick={() => setMode('type')}
            title="Type mode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          </button>
        </div>

        {mode === 'draw' && (
          <>
            <div className="pad-colors">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <div className="pad-size">
              <input
                type="range"
                min="1"
                max="12"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                title={`Brush size: ${lineWidth}`}
              />
            </div>
          </>
        )}

        <button className="pad-clear-btn" onClick={clearCanvas} title="Clear scratch pad">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <div className="pad-canvas-area" ref={containerRef}>
        {mode === 'draw' ? (
          <canvas
            ref={canvasRef}
            className="pad-canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        ) : (
          <textarea
            className="pad-textarea"
            placeholder="Start typing your notes here…&#10;&#10;Like a pocket notebook — quick, simple, always ready."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            autoFocus
          />
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   DRAWER HANDLE (Mobile)
   ═══════════════════════════════════════════════ */
function DrawerHandle({ isOpen, onToggle }) {
  return (
    <button className="drawer-handle" onClick={onToggle} aria-label="Toggle calculator">
      <div className="drawer-handle-bar" />
      <span className="drawer-handle-label">{isOpen ? 'Close' : 'Calculator'}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════════
   ONBOARDING MODAL
   ═══════════════════════════════════════════════ */
const TIPS = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    title: 'Dark & Light Mode',
    desc: 'Click the sun/moon icon in the top-right corner to switch between dark and light themes. Your preference is saved automatically.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    title: 'Draw & Type Modes',
    desc: 'The scratch pad has two modes — use the pen icon to draw with touch or mouse, and the text icon to type notes. Switch anytime!',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="12" y2="14" />
      </svg>
    ),
    title: 'Basic ↔ Scientific',
    desc: 'Toggle between Basic and Scientific calculator modes. Scientific adds trig, log, memory, and more. Full keyboard support too!',
  },
]

function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      const seen = localStorage.getItem('sigmapad-onboarding-seen')
      if (!seen) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem('sigmapad-onboarding-seen', '1')
    } catch { /* */ }
  }

  const next = () => {
    if (step < TIPS.length - 1) setStep((s) => s + 1)
    else dismiss()
  }

  const prev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  if (!visible) return null

  const tip = TIPS[step]

  return (
    <div className="onboarding-overlay" onClick={dismiss}>
      <div className="onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <button className="onboarding-close" onClick={dismiss} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="onboarding-icon">{tip.icon}</div>
        <h2 className="onboarding-title">{tip.title}</h2>
        <p className="onboarding-desc">{tip.desc}</p>

        <div className="onboarding-dots">
          {TIPS.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot ${i === step ? 'active' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 ? (
            <button className="onboarding-btn secondary" onClick={prev}>Back</button>
          ) : (
            <button className="onboarding-btn secondary" onClick={dismiss}>Skip</button>
          )}
          <button className="onboarding-btn primary" onClick={next}>
            {step < TIPS.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
function App() {
  const [isScientific, setIsScientific] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false)
  }, [isMobile])

  return (
    <ThemeProvider>
      <OnboardingModal />
      <div className="app">
        {/* ─── Top Bar ─── */}
        <header className="top-bar">
          <div className="brand">
            <span className="brand-sigma">Σ</span>
            <span className="brand-name">SigmaPad</span>
          </div>
          <StockTicker />
          <ThemeToggle />
        </header>

        {/* ─── Main Content ─── */}
        <main className="main-content">
          {isMobile ? (
            <>
              {/* Mobile: drawer-based calculator */}
              <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
                <Calculator isScientific={isScientific} setIsScientific={setIsScientific} />
              </div>
              {drawerOpen && (
                <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
              )}
              <DrawerHandle isOpen={drawerOpen} onToggle={() => setDrawerOpen(!drawerOpen)} />
            </>
          ) : (
            /* Desktop: side panel calculator */
            <div className={`calc-panel ${isScientific ? 'scientific' : ''}`}>
              <Calculator isScientific={isScientific} setIsScientific={setIsScientific} />
            </div>
          )}

          {/* ─── Scratch Pad ─── */}
          <div className="pad-panel">
            <ScratchPad />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
