import * as pdfjsLib from 'pdfjs-dist'

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export interface PayslipData {
  monthKey: string  // "YYYY-MM"
  netSalary: number
  source: string    // employer name
  lines: { label: string; amount: number }[]
}

const HEBREW_MONTHS: Record<string, number> = {
  'ינואר': 1, 'פברואר': 2, 'מרס': 3, 'מרץ': 3,
  'אפריל': 4, 'מאי': 5, 'יוני': 6,
  'יולי': 7, 'אוגוסט': 8, 'ספטמבר': 9,
  'אוקטובר': 10, 'נובמבר': 11, 'דצמבר': 12,
}

function parseMonthKey(text: string): string | null {
  // Format MM/YYYY e.g. "04/2026"
  const mmyyyy = text.match(/\b(\d{2})\/(\d{4})\b/)
  if (mmyyyy) {
    const m = parseInt(mmyyyy[1])
    const y = mmyyyy[2]
    if (m >= 1 && m <= 12) return `${y}-${String(m).padStart(2, '0')}`
  }
  // Hebrew month name + year
  for (const [heb, num] of Object.entries(HEBREW_MONTHS)) {
    const match = text.match(new RegExp(`${heb}\\s+(\\d{4})`))
    if (match) return `${match[1]}-${String(num).padStart(2, '0')}`
  }
  return null
}

function parseAmount(s: string): number | null {
  // Handle formats like "16,772.00" or "16772.00" or "16,772"
  const clean = s.replace(/,/g, '').trim()
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

export async function parsePayslipPDF(buffer: ArrayBuffer): Promise<PayslipData> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    fullText += pageText + '\n'
  }

  // Extract month — look for "לחודש MM/YYYY" pattern
  let monthKey: string | null = null
  const monthMatch = fullText.match(/לחודש\s+(\d{2}\/\d{4})/)
  if (monthMatch) monthKey = parseMonthKey(monthMatch[1])
  if (!monthKey) monthKey = parseMonthKey(fullText) // fallback: first MM/YYYY found

  if (!monthKey) throw new Error('Impossible de détecter le mois de la fiche de paie')

  // Extract net salary — "שכר נטו" followed by the amount
  let netSalary = 0
  const netoMatch = fullText.match(/שכר נטו\s+([\d,]+\.?\d*)/)
  if (netoMatch) {
    netSalary = parseAmount(netoMatch[1]) ?? 0
  }
  // Also try "לתשלום" (total to pay)
  if (!netSalary) {
    const ltashlumMatch = fullText.match(/לתשלום\s+([\d,]+\.?\d*)/)
    if (ltashlumMatch) netSalary = parseAmount(ltashlumMatch[1]) ?? 0
  }

  if (!netSalary) throw new Error('Impossible de détecter le salaire net')

  // Extract employer name
  let source = 'Salaire'
  const companyMatch = fullText.match(/חברה\s*:\s*\d+\s*[-–]\s*([^\n]+?)(?:\s+תיק|$)/m)
  if (companyMatch) source = companyMatch[1].trim()

  // Extract pay lines (description + amount pairs)
  const lines: { label: string; amount: number }[] = []
  const payLineRegex = /(\d{3})\s+([^\d]+?)\s+([\d,]+\.?\d*)/g
  let match
  while ((match = payLineRegex.exec(fullText)) !== null) {
    const amount = parseAmount(match[3])
    if (amount && amount > 0 && amount < 50000) {
      lines.push({ label: match[2].trim(), amount })
    }
  }

  return { monthKey, netSalary, source, lines }
}
