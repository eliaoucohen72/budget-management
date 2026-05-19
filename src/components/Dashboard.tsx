import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { MonthData, MonthlySummary } from '../types'
import { CATEGORY_LABELS } from '../types'

interface Props {
  monthData: MonthData
  summary: MonthlySummary
}

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']

function SummaryCard({
  label,
  amount,
  colorClass,
}: {
  label: string
  amount: number
  colorClass: string
}) {
  return (
    <div className={`rounded-xl p-4 shadow-sm border ${colorClass}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{fmt(amount)} ₪</p>
    </div>
  )
}

function GaugeBar({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">{fmt(value)} ₪ ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Dashboard({ monthData, summary }: Props) {
  const isOverBudget = summary.balance < 0

  const categoryTotals: Record<string, number> = {}
  for (const e of monthData.expenses.filter((e) => e.type === 'variable')) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount
  }
  const pieData = Object.entries(categoryTotals).map(([cat, val]) => ({
    name: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat,
    value: val,
  }))

  return (
    <div className="space-y-6">
      {isOverBudget && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span className="font-medium">
            Les dépenses dépassent les revenus de {fmt(Math.abs(summary.balance))} ₪
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Total revenus"
          amount={summary.totalIncome}
          colorClass="bg-green-50 border-green-200 text-green-800"
        />
        <SummaryCard
          label="Total dépenses"
          amount={summary.totalExpenses}
          colorClass="bg-red-50 border-red-200 text-red-800"
        />
        <SummaryCard
          label="Solde"
          amount={summary.balance}
          colorClass={
            summary.balance >= 0
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-red-100 border-red-400 text-red-900'
          }
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Répartition des dépenses</h2>
        <GaugeBar
          label="Fixes"
          value={summary.totalFixed}
          total={summary.totalExpenses}
          color="bg-blue-500"
        />
        <GaugeBar
          label="Variables"
          value={summary.totalVariable}
          total={summary.totalExpenses}
          color="bg-amber-400"
        />
        <GaugeBar
          label="Mensualités"
          value={summary.totalInstallments}
          total={summary.totalExpenses}
          color="bg-purple-500"
        />
      </div>

      {pieData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Dépenses variables par catégorie</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${fmt(v)} ₪`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Dernières dépenses variables</h2>
        {monthData.expenses.filter((e) => e.type === 'variable').length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune dépense variable ce mois-ci</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...monthData.expenses]
              .filter((e) => e.type === 'variable')
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 8)
              .map((e) => (
                <div key={e.id} className="flex justify-between items-center py-2 text-sm">
                  <div>
                    <span className="font-medium">{e.label}</span>
                    <span className="text-gray-400 ml-2 text-xs">
                      {CATEGORY_LABELS[e.category]}
                    </span>
                  </div>
                  <span className="font-semibold text-red-600">{fmt(e.amount)} ₪</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
