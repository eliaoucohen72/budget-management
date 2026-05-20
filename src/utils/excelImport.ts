import * as XLSX from 'xlsx'
import type { Expense, Installment, Income, MonthData, ExpenseCategory, SavingsEntry, SavingsExpense } from '../types'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function guessCategory(label: string): ExpenseCategory {
  if (/שכיר|שכר דירה/.test(label)) return 'rent'
  if (/אוטובוס|מונית|דלק|תחבורה/.test(label)) return 'transport'
  if (/ביטוח|מבטח|הראל|מנורה|קופת חולים/.test(label)) return 'insurance'
  if (/תלמוד|בית ספר|סמינר|גן|חוג|חינוך/.test(label)) return 'education'
  if (/מסעדה|קפה|אוכל בחוץ/.test(label)) return 'restaurant'
  if (/בית מרקחת|תרופ|ויטמין|רופא|פסיכ/.test(label)) return 'pharmacy'
  if (/בגד|ביגוד|נעל/.test(label)) return 'clothing'
  if (/מתנ|חתונה|שמחה/.test(label)) return 'gifts'
  if (/יש|ברכל|נטו|קרפור|מחסני|יוחנ|סופר|קנייה|קניות|מזון/.test(label)) return 'groceries'
  return 'other'
}

function parseInstallmentPattern(label: string): { paid: number; total: number } | null {
  const match = label.match(/(\d+)\s+מתוך\s+(\d+)/)
  if (!match) return null
  return { paid: parseInt(match[1]), total: parseInt(match[2]) }
}

function cleanInstallmentLabel(label: string): string {
  return label
    .replace(/\s*[-–]\s*תשלום\s+\d+\s+מתוך\s+\d+/g, '')
    .replace(/\s*[-–]\s*\d+\s+מתוך\s+\d+/g, '')
    .replace(/\s*תשלום\s+\d+\s+מתוך\s+\d+/g, '')
    .trim()
}

const HEBREW_MONTHS: Record<string, number> = {
  'ינואר': 1, 'פברואר': 2, 'מרס': 3, 'מרץ': 3,
  'אפריל': 4, 'מאי': 5, 'יוני': 6,
  'יולי': 7, 'אוגוסט': 8, 'ספטמבר': 9,
  'אוקטובר': 10, 'נובמבר': 11, 'דצמבר': 12,
}

function parseSheetName(name: string): string | null {
  for (const [heb, num] of Object.entries(HEBREW_MONTHS)) {
    const yearMatch = name.match(new RegExp(`${heb}\\s+(\\d{4})`))
    if (yearMatch) {
      return `${yearMatch[1]}-${String(num).padStart(2, '0')}`
    }
  }
  return null
}

type RawRow = (string | number)[]

const HEADER_LABELS = new Set(['הוצאות', 'הכנסות', 'תשלומים', ''])

// A row with a numeric value in col C marks the start of a new section,
// but only when col A is a real expense label (not a global header row)
function isSectionMarker(row: RawRow): boolean {
  if (typeof row[2] !== 'number' || (row[2] as number) <= 0) return false
  const label = typeof row[0] === 'string' ? row[0].trim() : ''
  return !HEADER_LABELS.has(label) && typeof row[0] !== 'number'
}

function isValidExpenseRow(row: RawRow): boolean {
  return (
    typeof row[0] === 'string' &&
    row[0].trim().length > 0 &&
    typeof row[1] === 'number' &&
    (row[1] as number) > 0
  )
}

function isValidIncomeRow(row: RawRow): boolean {
  return (
    typeof row[4] === 'string' &&
    (row[4] as string).trim().length > 0 &&
    typeof row[5] === 'number' &&
    (row[5] as number) > 0
  )
}

export interface ImportResult {
  monthKey: string
  monthData: MonthData
}

export interface ExcelFileResult {
  months: ImportResult[]
  savings: SavingsEntry[]
  savingsExpenses: SavingsExpense[]
}

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12,
}

// Parse a date cell: Excel serial, "DD/MM/YYYY", "YYYY-MM-DD", or "DD mois YYYY"
function parseDateCell(cell: string | number): string | null {
  if (typeof cell === 'number') {
    const date = XLSX.SSF.parse_date_code(cell)
    if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }
  if (typeof cell === 'string' && cell.trim()) {
    const s = cell.trim()
    // "DD/MM/YYYY"
    const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
    // "YYYY-MM-DD"
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (iso) return s.slice(0, 10)
    // "15 mai 2026" or "15 Mai 2026"
    const french = s.match(/^(\d{1,2})\s+([a-zéûôàè]+)\s+(\d{4})$/i)
    if (french) {
      const monthNum = FRENCH_MONTHS[french[2].toLowerCase()]
      if (monthNum) return `${french[3]}-${String(monthNum).padStart(2, '0')}-${french[1].padStart(2, '0')}`
    }
  }
  return null
}

interface SavingsSheetResult {
  entries: SavingsEntry[]
  expenses: SavingsExpense[]
}

function parseSavingsSheet(ws: XLSX.WorkSheet): SavingsSheetResult {
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' })
  const entries: SavingsEntry[] = []
  const expenses: SavingsExpense[] = []

  for (const row of rows) {
    // Col A+B → versements
    if (row[0] && row[1]) {
      const date = parseDateCell(row[0] as string | number)
      const amount = typeof row[1] === 'number' ? row[1] : parseFloat(String(row[1]))
      if (date && !isNaN(amount) && amount > 0) {
        entries.push({ date, amount })
      }
    }
    // Col D+E+F → dépenses prévues
    if (row[3] && row[4]) {
      const label = String(row[3]).trim()
      const amount = typeof row[4] === 'number' ? row[4] : parseFloat(String(row[4]))
      const paidRaw = typeof row[5] === 'string' ? row[5].trim().toLowerCase() : ''
      const paid = paidRaw === 'oui'
      if (label && !isNaN(amount) && amount > 0) {
        expenses.push({ label, amount, paid })
      }
    }
  }

  return { entries, expenses }
}

export function parseExcelFile(buffer: ArrayBuffer): ExcelFileResult {
  const wb = XLSX.read(buffer, { type: 'array' })
  const results: ImportResult[] = []
  let savings: SavingsEntry[] = []
  let savingsExpenses: SavingsExpense[] = []

  for (const sheetName of wb.SheetNames) {
    // Savings sheet — not a monthly budget sheet
    if (!parseSheetName(sheetName)) {
      const ws = wb.Sheets[sheetName]
      const parsed = parseSavingsSheet(ws)
      if (parsed.entries.length > 0) savings = parsed.entries
      if (parsed.expenses.length > 0) savingsExpenses = parsed.expenses
      continue
    }
    const monthKey = parseSheetName(sheetName)!


    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { header: 1, defval: '' })

    const expenses: Expense[] = []
    const installments: Installment[] = []
    const incomes: Income[] = []

    const [year, month] = monthKey.split('-')
    const defaultDate = `${year}-${month}-01`

    // Sections: 0 = fixed, 1 = installments, 2 = variable
    let sectionIndex = -1

    for (const row of rows) {
      // Collect incomes from col E+F regardless of section
      if (isValidIncomeRow(row)) {
        incomes.push({
          id: generateId(),
          source: (row[4] as string).trim(),
          amount: row[5] as number,
          date: defaultDate,
        })
      }

      // A section marker advances to the next section and also processes its own first row
      if (isSectionMarker(row)) {
        sectionIndex++
        // The marker row itself may carry a valid expense (first item of the section)
        if (!isValidExpenseRow(row)) continue
      } else {
        if (!isValidExpenseRow(row)) continue
      }

      const rawLabel = (row[0] as string).trim()
      const amount = row[1] as number

      if (sectionIndex === 0) {
        // Fixed expenses
        if (rawLabel === 'חודש קודם') continue
        expenses.push({
          id: generateId(),
          label: rawLabel,
          amount,
          category: guessCategory(rawLabel),
          type: 'fixed',
          date: defaultDate,
        })
      } else if (sectionIndex === 1) {
        // Installments — every row should have X מתוך Y pattern
        const inst = parseInstallmentPattern(rawLabel)
        if (inst) {
          installments.push({
            id: generateId(),
            label: cleanInstallmentLabel(rawLabel),
            monthlyAmount: amount,
            paidMonths: inst.paid,
            totalMonths: inst.total,
            startDate: defaultDate,
          })
        } else {
          // Ongoing installment without X/Y (ex: דוד בוים לתמר)
          installments.push({
            id: generateId(),
            label: rawLabel,
            monthlyAmount: amount,
            paidMonths: 1,
            totalMonths: 0,
            startDate: defaultDate,
          })
        }
      } else if (sectionIndex >= 2) {
        // Variable expenses
        expenses.push({
          id: generateId(),
          label: rawLabel,
          amount,
          category: guessCategory(rawLabel),
          type: 'variable',
          date: defaultDate,
        })
      }
    }

    results.push({
      monthKey,
      monthData: { key: monthKey, expenses, installments, incomes },
    })
  }

  return { months: results, savings, savingsExpenses }
}
