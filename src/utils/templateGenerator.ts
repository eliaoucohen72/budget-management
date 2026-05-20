import * as XLSX from 'xlsx'

function getMonthName(year: number, month: number): string {
  const HEBREW_MONTHS = [
    'ינואר', 'פברואר', 'מרס', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  ]
  return `${HEBREW_MONTHS[month - 1]} ${year}`
}

const s = (v: string): XLSX.CellObject => ({ t: 's', v })
const n = (v: number): XLSX.CellObject => ({ t: 'n', v })
const formula = (f: string, v: number): XLSX.CellObject => ({ t: 'n', f, v })

function buildMonthSheet(): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {}

  // ── Row 1: global header with SUM formulas ──
  ws['A1'] = s('הוצאות')
  ws['C1'] = formula('SUM(B3:B50)', 2100)
  ws['E1'] = s('הכנסות')
  ws['F1'] = formula('SUM(F3:F50)', 5000)
  ws['H1'] = formula('F1-C1', 2900)

  // ── Row 3: first fixed expense — col C = subtotal (rows 3-12) ──
  ws['A3'] = s('הוצאה קבועה')
  ws['B3'] = n(1000)
  ws['C3'] = formula('SUM(B3:B12)', 1000)
  ws['E3'] = s('הכנסה קבועה')
  ws['F3'] = n(5000)

  for (let r = 4; r <= 12; r++) {
    ws[`A${r}`] = s('')
    ws[`B${r}`] = s('')
  }

  // ── Row 14: first installment — col C = subtotal (rows 14-20) ──
  ws['A14'] = s('הלואה - X מתוך Y')
  ws['B14'] = n(1000)
  ws['C14'] = formula('SUM(B14:B20)', 1000)

  for (let r = 15; r <= 20; r++) {
    ws[`A${r}`] = s('')
    ws[`B${r}`] = s('')
  }

  // ── Row 22: first variable expense — col C = subtotal (rows 22-50) ──
  ws['A22'] = s('הוצאה משתנה')
  ws['B22'] = n(100)
  ws['C22'] = formula('SUM(B22:B50)', 100)

  for (let r = 23; r <= 35; r++) {
    ws[`A${r}`] = s('')
    ws[`B${r}`] = s('')
  }

  ws['!ref'] = 'A1:H50'
  ws['!cols'] = [
    { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 4 },
    { wch: 22 }, { wch: 12 }, { wch: 4  }, { wch: 12 },
  ]

  return ws
}

function buildSavingsSheet(): (string | number)[][] {
  return [
    ['15 mai 2026', 500, '', 'Traiteur', 6000],
    ['20 mai 2026', 500, '', 'Photographe', 2000],
  ]
}

export function generateTemplate(): void {
  const wb = XLSX.utils.book_new()

  const now = new Date()
  for (let i = 0; i < 5; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    XLSX.utils.book_append_sheet(wb, buildMonthSheet(), getMonthName(d.getFullYear(), d.getMonth() + 1))
  }

  const savingsWs = XLSX.utils.aoa_to_sheet(buildSavingsSheet())
  savingsWs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 4 }, { wch: 20 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, savingsWs, 'חסכון בר מצווה אהרון חיים')

  XLSX.writeFile(wb, 'budget-template.xlsx')
}
