import React, { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Coffee, ExternalLink, Plus, Trash2, ClipboardPaste, ArrowRight, Bookmark } from 'lucide-react'
import { loadSearches, saveSearches, normalizeUrl, parseShared, HC_HOME } from '../lib/hiringCafe.js'

const inputCls = 'w-full mt-1 px-2.5 py-1.5 rounded-md border text-sm bg-transparent'
const inputStyle = { borderColor: 'var(--border)', color: 'var(--text)' }
const labelCls = 'text-[11px] uppercase tracking-wide'

// Desktop "Share" substitute: a bookmark that, clicked while viewing a job on
// HiringCafe, opens this tracker with the job's title and link pre-filled.
function bookmarkletCode() {
  const base = window.location.origin + window.location.pathname
  return (
    "javascript:(()=>{window.open('" +
    base +
    "?title='+encodeURIComponent(document.title)+'&url='+encodeURIComponent(location.href),'_blank')})()"
  )
}

function SectionTitle({ children }) {
  return (
    <h4 className="font-display font-semibold text-sm mb-2" style={{ color: 'var(--text)' }}>
      {children}
    </h4>
  )
}

export default function HiringCafeModal({ open, onClose, onQuickAdd }) {
  const [searches, setSearches] = useState(loadSearches)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [pasted, setPasted] = useState('')
  const [error, setError] = useState('')

  // React won't render javascript: hrefs from JSX, so set it directly.
  const bookmarkRef = useCallback((el) => {
    if (el) el.setAttribute('href', bookmarkletCode())
  }, [])

  useEffect(() => saveSearches(searches), [searches])

  const addSearch = () => {
    const url = normalizeUrl(newUrl)
    if (!newName.trim() || !url) {
      setError('Give the search a name and paste its HiringCafe address.')
      return
    }
    setSearches((prev) => [...prev, { id: `hc-${Date.now()}`, name: newName.trim(), url }])
    setNewName('')
    setNewUrl('')
    setError('')
  }

  const removeSearch = (id) => setSearches((prev) => prev.filter((s) => s.id !== id))

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setPasted(text)
    } catch {
      setError('Your browser blocked clipboard access — long-press the box and paste instead.')
    }
  }

  const quickAdd = () => {
    const fields = parseShared({ text: pasted })
    if (!fields.jobLink && !fields.title) {
      setError('Paste a HiringCafe job link (or the shared text) first.')
      return
    }
    setPasted('')
    setError('')
    onQuickAdd(fields)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-md max-h-[88vh] overflow-y-auto z-50 rounded-xl border p-5 shadow-panel"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Coffee size={18} className="text-signal-amber" />
                HiringCafe
              </h3>
              <button onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Saved searches */}
            <section className="mb-5">
              <SectionTitle>Your searches</SectionTitle>
              <div className="space-y-2">
                {searches.map((s) => (
                  <div key={s.id} className="flex items-stretch gap-2">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      <span className="truncate">{s.name}</span>
                      <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                    </a>
                    {s.url !== HC_HOME && (
                      <button
                        onClick={() => removeSearch(s.id)}
                        title="Remove search"
                        aria-label={`Remove ${s.name}`}
                        className="px-2.5 rounded-lg border hover:text-signal-red"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <details className="mt-3">
                <summary className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                  + Save a new search
                </summary>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Set your filters on HiringCafe, copy the page address, and paste it here.
                </p>
                <div className="mt-2 space-y-2">
                  <div>
                    <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Name</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="NOC – Remote"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'var(--text-muted)' }}>HiringCafe address</label>
                    <input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://hiring.cafe/?searchState=…"
                      inputMode="url"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <button
                    onClick={addSearch}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-medium hover:bg-[var(--surface-2)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <Plus size={14} /> Save search
                  </button>
                </div>
              </details>
            </section>

            {/* Quick add */}
            <section className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <SectionTitle>Add a listing you found</SectionTitle>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                On HiringCafe, copy the job's link (or use Share → Copy), then paste it here.
              </p>
              <div className="flex gap-2">
                <input
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder="Paste job link"
                  inputMode="url"
                  className={inputCls + ' mt-0'}
                  style={inputStyle}
                />
                <button
                  onClick={pasteFromClipboard}
                  title="Paste from clipboard"
                  aria-label="Paste from clipboard"
                  className="px-2.5 rounded-md border hover:bg-[var(--surface-2)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <ClipboardPaste size={16} />
                </button>
              </div>
              <button
                onClick={quickAdd}
                className="w-full mt-3 py-2 rounded-md bg-signal-amber text-ink-950 font-medium text-sm hover:brightness-110 flex items-center justify-center gap-1.5"
              >
                Add to board <ArrowRight size={14} />
              </button>
            </section>

            {/* Desktop one-click */}
            <section className="hidden sm:block pt-4 mt-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <SectionTitle>One-click from your computer</SectionTitle>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Drag this button up to your browser's bookmarks bar. Then, while you're looking at a job on
                HiringCafe, click it and Dossier opens with that job filled in.
              </p>
              <a
                ref={bookmarkRef}
                onClick={(e) => e.preventDefault()}
                draggable
                title="Drag me to your bookmarks bar"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium cursor-grab"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface-2)' }}
              >
                <Bookmark size={14} className="text-signal-amber" />
                → Dossier
              </a>
            </section>

            {error && <p className="text-xs text-signal-red mt-3">{error}</p>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
