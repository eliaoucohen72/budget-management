export type ExpenseCategory =
  | 'rent'
  | 'transport'
  | 'insurance'
  | 'education'
  | 'groceries'
  | 'pharmacy'
  | 'restaurant'
  | 'clothing'
  | 'gifts'
  | 'other'

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Loyer',
  transport: 'Transport',
  insurance: 'Assurance',
  education: 'Éducation',
  groceries: 'Courses',
  pharmacy: 'Pharmacie',
  restaurant: 'Restaurant',
  clothing: 'Vêtements',
  gifts: 'Cadeaux',
  other: 'Autre',
}

export type ExpenseType = 'fixed' | 'variable'

export interface Expense {
  id: string
  label: string
  amount: number
  category: ExpenseCategory
  type: ExpenseType
  date: string // ISO date string YYYY-MM-DD
}

export interface Installment {
  id: string
  label: string
  monthlyAmount: number
  paidMonths: number
  totalMonths: number // 0 = ongoing (no end)
  startDate: string // ISO date YYYY-MM-DD of first payment
}

export interface Income {
  id: string
  source: string
  amount: number
  date: string // ISO date string YYYY-MM-DD
}

export interface MonthData {
  key: string // "YYYY-MM"
  expenses: Expense[]
  installments: Installment[]
  incomes: Income[]
}

export interface SavingsEntry {
  date: string // YYYY-MM-DD
  amount: number
}

export interface SavingsExpense {
  label: string
  amount: number
  paid: boolean
}

export interface SavingsProject {
  name: string
  entries: SavingsEntry[]
  expenses: SavingsExpense[]
}

export interface BudgetStore {
  months: Record<string, MonthData>
  savingsProjects: SavingsProject[]
}

// Derived summary for display
export interface MonthlySummary {
  totalIncome: number
  totalFixed: number
  totalVariable: number
  totalInstallments: number
  totalExpenses: number
  balance: number
}
