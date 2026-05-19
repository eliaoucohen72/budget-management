import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import type { BudgetStore } from '../types'
import { computeSummary } from '../store/budgetStore'

interface Props {
  store: BudgetStore
  currentYear: number
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function AnnualView({ store, currentYear }: Props) {
  const chartData = MONTH_NAMES.map((name, i) => {
    const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`
    const monthData = store.months[key]
    if (!monthData) {
      return { name, Revenus: 0, Dépenses: 0, Solde: 0 }
    }
    const s = computeSummary(monthData)
    return {
      name,
      Revenus: s.totalIncome,
      Dépenses: s.totalExpenses,
      Solde: s.balance,
    }
  })

  const totalIncome = chartData.reduce((s, d) => s + d.Revenus, 0)
  const totalExpenses = chartData.reduce((s, d) => s + d.Dépenses, 0)
  const avgBalance = chartData.reduce((s, d) => s + d.Solde, 0) / 12

  const tooltipFormatter = (value: number) => `${fmt(value)} ₪`

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Bilan annuel {currentYear}</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 mb-1">Total revenus</p>
          <p className="text-xl font-bold text-green-800">{fmt(totalIncome)} ₪</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 mb-1">Total dépenses</p>
          <p className="text-xl font-bold text-red-800">{fmt(totalExpenses)} ₪</p>
        </div>
        <div className={`rounded-xl p-4 border ${avgBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-100 border-red-300'}`}>
          <p className="text-xs text-blue-600 mb-1">Solde mensuel moyen</p>
          <p className={`text-xl font-bold ${avgBalance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
            {fmt(avgBalance)} ₪
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Revenus vs Dépenses</h3>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={75} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar dataKey="Revenus" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Évolution du solde mensuel</h3>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={75} />
              <Tooltip formatter={tooltipFormatter} />
              <Line
                type="monotone"
                dataKey="Solde"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Tableau mensuel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2">Mois</th>
                <th className="text-left px-4 py-2">Revenus</th>
                <th className="text-left px-4 py-2">Dépenses</th>
                <th className="text-left px-4 py-2">Solde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chartData.map((row) => (
                <tr key={row.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{row.name}</td>
                  <td className="px-4 py-2 text-green-600 font-medium">{fmt(row.Revenus)} ₪</td>
                  <td className="px-4 py-2 text-red-600 font-medium">{fmt(row.Dépenses)} ₪</td>
                  <td className={`px-4 py-2 font-semibold ${row.Solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {fmt(row.Solde)} ₪
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
