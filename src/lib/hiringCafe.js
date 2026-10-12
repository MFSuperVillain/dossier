// HiringCafe helpers: saved searches (stored locally) and parsing a shared
// listing (title / text / url from a phone's Share sheet or a pasted link)
// into fields for a new application.

export const HC_SEARCHES_KEY = 'hiringCafeSearches'
export const HC_HOME = 'https://hiring.cafe/'

const DEFAULT_SEARCHES = [{ id: 'hc-home', name: 'Browse HiringCafe', url: HC_HOME }]

export function loadSearches() {
  try {
    const saved = JSON.parse(localStorage.getItem(HC_SEARCHES_KEY))
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_SEARCHES
  } catch {
    return DEFAULT_SEARCHES
  }
}

export function saveSearches(searches) {
  try {
    localStorage.setItem(HC_SEARCHES_KEY, JSON.stringify(searches))
  } catch {
    /* storage unavailable — keep in memory only */
  }
}

export function normalizeUrl(raw) {
  const s = (raw || '').trim()
  if (!s) return ''
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`
  try {
    return new URL(withScheme).toString()
  } catch {
    return ''
  }
}

const URL_RE = /https?:\/\/[^\s<>"']+/i

// Split strings like "NOC Engineer at Equinix", "NOC Engineer - Equinix",
// "NOC Engineer | Equinix | HiringCafe" into { title, company }.
export function splitTitleCompany(str) {
  let s = (str || '').replace(URL_RE, '').replace(/\s+/g, ' ').trim()
  s = s.replace(/\s*[|\-–—]\s*hiring\s*\.?\s*cafe\s*$/i, '').trim()
  if (!s) return { title: '', company: '' }
  const at = s.match(/^(.+?)\s+at\s+(.+)$/i)
  if (at) return { title: at[1].trim(), company: at[2].trim() }
  const sep = s.split(/\s+[|–—-]\s+/)
  if (sep.length >= 2) return { title: sep[0].trim(), company: sep[1].trim() }
  return { title: s, company: '' }
}

// Build add-form fields from whatever a share or paste handed us.
export function parseShared({ title = '', text = '', url = '', company = '' } = {}) {
  const link = normalizeUrl(url) || normalizeUrl((text.match(URL_RE) || title.match(URL_RE) || [])[0])
  const fromTitle = splitTitleCompany(title)
  const fromText = splitTitleCompany(text)
  return {
    title: fromTitle.title || fromText.title,
    company: company || fromTitle.company || fromText.company,
    jobLink: link,
  }
}

// Read share/deep-link params from the current address, if any.
export function readIncomingShare() {
  const p = new URLSearchParams(window.location.search)
  const title = p.get('title') || ''
  const text = p.get('text') || ''
  const url = p.get('url') || p.get('link') || ''
  const company = p.get('company') || ''
  if (!title && !text && !url && !company) return null
  return parseShared({ title, text, url, company })
}

export function clearIncomingShare() {
  try {
    const clean = window.location.pathname + window.location.hash
    window.history.replaceState(null, '', clean)
  } catch {
    /* ignore */
  }
}
