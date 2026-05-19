import * as XLSX from 'xlsx'
import type { Expense, Installment, Income, MonthData, ExpenseCategory } from '../types'

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

export function parseExcelFile(buffer: ArrayBuffer): ImportResult[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const results: ImportResult[] = []

  for (const sheetName of wb.SheetNames) {
    const monthKey = parseSheetName(sheetName)
    if (!monthKey) continue

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

  return results
}
