/**
 * Parses a CSV string into an array of objects.
 * The first row is treated as headers.
 *
 * WHY we replaced the old version:
 * The previous parser used `line.split(',')` which breaks whenever a field
 * contains a comma inside quotes — e.g. a reference like:
 *   "He oversaw the introduction of the Education Act 1944, which introduced..."
 * would get silently truncated at the comma.
 *
 * This version walks the raw text character by character (RFC 4180 compliant):
 * - Tracks whether we're inside a quoted field
 * - Only splits on commas that are outside quotes
 * - Handles escaped quotes ("") inside quoted fields
 * - Handles \r\n and \n line endings
 */
export function parseCSV(text) {
  const rows = parseRows(text.trim())
  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.trim())

  return rows.slice(1)
    .filter(row => row.some(cell => cell.trim() !== ''))  // skip blank rows
    .map(row => {
      return headers.reduce((obj, header, i) => {
        obj[header] = row[i] ?? ''
        return obj
      }, {})
    })
}

/**
 * Splits raw CSV text into a 2D array of strings (rows × fields).
 * Correctly handles:
 *  - Quoted fields:  "hello, world" → one field
 *  - Escaped quotes: "say ""hi""" → say "hi"
 *  - Multiline quoted fields (references can span lines)
 *  - Both \r\n and \n line endings
 */
function parseRows(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead: "" means an escaped quote character
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
        } else {
          // Closing quote
          inQuotes = false
          i++
        }
      } else {
        field += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        row.push(field)
        field = ''
        i++
      } else if (ch === '\r' && text[i + 1] === '\n') {
        // Windows line ending
        row.push(field)
        rows.push(row)
        row = []
        field = ''
        i += 2
      } else if (ch === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
        i++
      } else {
        field += ch
        i++
      }
    }
  }

  // Push the last field/row (no trailing newline needed)
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}
