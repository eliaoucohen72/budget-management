import { useState, useEffect, useCallback } from 'react'
import type {
  BudgetStore,
  MonthData,
  Expense,
  Installment,
  Income,
  MonthlySummary,
} from '../types'

const STORAGE_KEY = 'family-budget-v1'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildSeedData(): BudgetStore {
  const jan = '2026-01'

  const expenses: Expense[] = [
    { id: generateId(), label: 'שכר דירה', amount: 4550, category: 'rent', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'שכר דירה 2', amount: 3300, category: 'rent', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'קופת חולים', amount: 900, category: 'insurance', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'אוטובוס אליהו', amount: 157.5, category: 'transport', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'אוטובוס אהרון חיים', amount: 157.5, category: 'transport', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'אוטובוס משה רפאל', amount: 157.5, category: 'transport', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'אוטובוס תמר', amount: 157.5, category: 'transport', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'ביטוח הראל', amount: 59.36, category: 'insurance', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'ביטוח מנורה', amount: 133.14, category: 'insurance', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'חשמל', amount: 1000, category: 'other', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'ארנונה', amount: 500, category: 'other', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'תלמוד תורה', amount: 800, category: 'education', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'בית ספר אבי עזרי', amount: 100, category: 'education', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'סמינר', amount: 160, category: 'education', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'ביטוח אחר', amount: 180, category: 'insurance', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'גן בת שבע', amount: 50, category: 'education', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'קווי טלפון', amount: 113.57, category: 'other', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'בית כנסת', amount: 50, category: 'other', type: 'fixed', date: '2026-01-01' },
    { id: generateId(), label: 'ציוד עבודה', amount: 67.08, category: 'other', type: 'fixed', date: '2026-01-01' },
  ]

  const installments: Installment[] = [
    { id: generateId(), label: 'הלוואה', monthlyAmount: 1000, paidMonths: 3, totalMonths: 144, startDate: '2025-11-01' },
    { id: generateId(), label: 'צהלון בת שבע', monthlyAmount: 260, paidMonths: 5, totalMonths: 8, startDate: '2025-09-01' },
    { id: generateId(), label: 'צהלון רחל', monthlyAmount: 80, paidMonths: 5, totalMonths: 5, startDate: '2025-09-01' },
    { id: generateId(), label: 'פעילות רחל', monthlyAmount: 63.2, paidMonths: 3, totalMonths: 10, startDate: '2025-11-01' },
    { id: generateId(), label: 'שיפוץ שפטי חיים', monthlyAmount: 50, paidMonths: 2, totalMonths: 20, startDate: '2025-12-01' },
    { id: generateId(), label: 'דוב בוים תמר', monthlyAmount: 19.9, paidMonths: 1, totalMonths: 0, startDate: '2026-01-01' },
  ]

  const incomes: Income[] = [
    { id: generateId(), source: 'Ravtech', amount: 16727, date: '2026-01-01' },
    { id: generateId(), source: 'אמא', amount: 650, date: '2026-01-01' },
  ]

  return {
    months: {
      [jan]: { key: jan, expenses, installments, incomes },
    },
    savingsProjects: [],
  }
}

function loadStore(): BudgetStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetStore & {
        savings?: import('../types').SavingsEntry[]
        savingsExpenses?: import('../types').SavingsExpense[]
      }
      // Migrate: convert old flat savings to projects array
      if (!parsed.savingsProjects) {
        parsed.savingsProjects = (parsed.savings?.length || parsed.savingsExpenses?.length)
          ? [{ name: 'Épargne', entries: parsed.savings ?? [], expenses: parsed.savingsExpenses ?? [] }]
          : []
        delete parsed.savings
        delete parsed.savingsExpenses
      }
      return parsed as BudgetStore
    }
  } catch {
    // corrupt data — start fresh
  }
  return buildSeedData()
}

function saveStore(store: BudgetStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function getOrCreateMonth(store: BudgetStore, monthKey: string): MonthData {
  if (store.months[monthKey]) return store.months[monthKey]
  return { key: monthKey, expenses: [], installments: [], incomes: [] }
}

export function computeSummary(data: MonthData): MonthlySummary {
  const totalIncome = data.incomes.reduce((s, i) => s + i.amount, 0)
  const totalFixed = data.expenses
    .filter((e) => e.type === 'fixed')
    .reduce((s, e) => s + e.amount, 0)
  const totalVariable = data.expenses
    .filter((e) => e.type === 'variable')
    .reduce((s, e) => s + e.amount, 0)
  const totalInstallments = data.installments.reduce((s, i) => s + i.monthlyAmount, 0)
  const totalExpenses = totalFixed + totalVariable + totalInstallments
  return {
    totalIncome,
    totalFixed,
    totalVariable,
    totalInstallments,
    totalExpenses,
    balance: totalIncome - totalExpenses,
  }
}

export function useBudget() {
  const [store, setStore] = useState<BudgetStore>(loadStore)

  const persist = useCallback((updated: BudgetStore) => {
    saveStore(updated)
    setStore(updated)
  }, [])

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setStore(JSON.parse(e.newValue) as BudgetStore)
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const getMonth = useCallback(
    (monthKey: string): MonthData => getOrCreateMonth(store, monthKey),
    [store]
  )

  const addExpense = useCallback(
    (monthKey: string, expense: Omit<Expense, 'id'>) => {
      const month = getOrCreateMonth(store, monthKey)
      const updated: BudgetStore = {
        ...store,
        months: {
          ...store.months,
          [monthKey]: {
            ...month,
            expenses: [...month.expenses, { ...expense, id: generateId() }],
          },
        },
      }
      persist(updated)
    },
    [store, persist]
  )

  const removeExpense = useCallback(
    (monthKey: string, expenseId: string) => {
      const month = getOrCreateMonth(store, monthKey)
      const updated: BudgetStore = {
        ...store,
        months: {
          ...store.months,
          [monthKey]: {
            ...month,
            expenses: month.expenses.filter((e) => e.id !== expenseId),
          },
        },
      }
      persist(updated)
    },
    [store, persist]
  )

  const addInstallment = useCallback(
    (monthKey: string, inst: Omit<Installment, 'id'>) => {
      const month = getOrCreateMonth(store, monthKey)
      const updated: BudgetStore = {
        ...store,
        months: {
          ...store.months,
          [monthKey]: {
            ...month,
            installments: [...month.installments, { ...inst, id: generateId() }],
          },
        },
      }
      persist(updated)
    },
    [store, persist]
  )

  const removeInstallment = useCallback(
    (monthKey: string, instId: string) => {
      const month = getOrCreateMonth(store, monthKey)
      const updated: BudgetStore = {
        ...store,
        months: {
          ...store.months,
          [monthKey]: {
            ...month,
            installments: month.installments.filter((i) => i.id !== instId),
          },
        },
      }
      persist(updated)
    },
    [store, persist]
  )

  const updateInstallment = useCallback(
    (monthKey: string, instId: string, patch: Partial<Omit<Installment, 'id'>>) => {
      const month = getOrCreateMonth(store, monthKey)
      const updated: BudgetStore = {
        ...store,
        months: {
          ...store.months,
          [monthKey]: {
            ...month,
            installments: month.installments.map((i) =>
              i.id === instId ? { ...i, ...patch } : i
            ),
          },
        },
      }
      persist(updated)
    },
    [store, persist]
  )

  const addIncome = useCallback(
    (monthKey: string, income: Omit<Income, 'id'>) => {
      const month = getOrCreateMonth(store, monthKey)
      const updated: BudgetStore = {
        ...store,
        months: {
          ...store.months,
          [monthKey]: {
            ...month,
            incomes: [...month.incomes, { ...income, id: generateId() }],
          },
        },
      }
      persist(updated)
    },
    [store, persist]
  )

  const removeIncome = useCallback(
    (monthKey: string, incomeId: string) => {
      const month = getOrCreateMonth(store, monthKey)
      const updated: BudgetStore = {
        ...store,
        months: {
          ...store.months,
          [monthKey]: {
            ...month,
            incomes: month.incomes.filter((i) => i.id !== incomeId),
          },
        },
      }
      persist(updated)
    },
    [store, persist]
  )

  const getAllMonthKeys = useCallback((): string[] => {
    return Object.keys(store.months).sort()
  }, [store])

  const importMonths = useCallback(
    (months: MonthData[]) => {
      const updated: BudgetStore = {
        ...store,
        months: {
          ...store.months,
          ...Object.fromEntries(months.map((m) => [m.key, m])),
        },
      }
      persist(updated)
    },
    [store, persist]
  )

  const importSavingsProjects = useCallback(
    (projects: import('../types').SavingsProject[]) => {
      const merged = [...store.savingsProjects]
      for (const p of projects) {
        const idx = merged.findIndex((x) => x.name === p.name)
        if (idx >= 0) merged[idx] = p
        else merged.push(p)
      }
      persist({ ...store, savingsProjects: merged })
    },
    [store, persist]
  )

  return {
    store,
    getMonth,
    addExpense,
    removeExpense,
    addInstallment,
    removeInstallment,
    updateInstallment,
    addIncome,
    removeIncome,
    getAllMonthKeys,
    importMonths,
    importSavingsProjects,
    computeSummary,
  }
}
