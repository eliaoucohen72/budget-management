import { useState } from 'react'
import Navigation, { type View } from './components/Navigation'
import Dashboard from './components/Dashboard'
import ExpenseForm from './components/ExpenseForm'
import IncomeForm from './components/IncomeForm'
import InstallmentTracker from './components/InstallmentTracker'
import AnnualView from './components/AnnualView'
import ImportExcel from './components/ImportExcel'
import SavingsView from './components/SavingsView'
import { useBudget, computeSummary } from './store/budgetStore'
import type { ExcelFileResult } from './utils/excelImport'

function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthKey)

  const { store, getMonth, importMonths, importSavingsProjects } = useBudget()

  const monthData = getMonth(currentMonth)
  const summary = computeSummary(monthData)
  const currentYear = Number(currentMonth.split('-')[0])

  const hasNextMonth = shiftMonth(currentMonth, 1) in store.months
  const hasPrevMonth = shiftMonth(currentMonth, -1) in store.months

  const handleImport = (result: ExcelFileResult) => {
    importMonths(result.months.map((r) => r.monthData))
    if (result.savingsProjects.length > 0) importSavingsProjects(result.savingsProjects)
    if (result.months.length > 0) {
      setCurrentMonth(result.months[0].monthKey)
      setView('dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeView={view}
        onViewChange={setView}
        currentMonth={currentMonth}
        onPrevMonth={() => setCurrentMonth((m) => shiftMonth(m, -1))}
        onNextMonth={() => setCurrentMonth((m) => shiftMonth(m, 1))}
        hasNextMonth={hasNextMonth}
        hasPrevMonth={hasPrevMonth}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {view === 'dashboard' && (
          <Dashboard monthData={monthData} summary={summary} />
        )}
        {view === 'expenses' && (
          <ExpenseForm monthData={monthData} />
        )}
        {view === 'income' && (
          <IncomeForm monthData={monthData} />
        )}
        {view === 'installments' && (
          <InstallmentTracker monthData={monthData} />
        )}
        {view === 'annual' && (
          <AnnualView store={store} currentYear={currentYear} />
        )}
        {view === 'import' && (
          <ImportExcel onImport={handleImport} />
        )}
        {view === 'savings' && (
          <SavingsView projects={store.savingsProjects} />
        )}
      </main>
    </div>
  )
}
