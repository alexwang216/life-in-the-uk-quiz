/**
 * Parses a CSV string into an array of objects.
 * The first row is treated as headers.
 *
 * WHY we use a character-by-character parser (RFC 4180 compliant):
 * The naive line.split(',') approach breaks when a field contains a comma
 * inside quotes — e.g. a reference like:
 *   "He oversaw the Education Act 1944, which introduced free secondary education."
 * This parser correctly handles quoted fields, escaped quotes (""), and
 * both \r\n and \n line endings.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const rows = parseRows(text.trim())
  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.trim())

  return rows
    .slice(1)
    .filter(row => row.some(cell => cell.trim() !== ''))
    .map(row =>
      headers.reduce<Record<string, string>>((obj, header, i) => {
        obj[header] = row[i] ?? ''
        return obj
      }, {})
    )
}

function parseRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
        } else {
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

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}
