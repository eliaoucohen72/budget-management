import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from 'recharts'
import type { BudgetStore } from '../types'
import { computeSummary } from '../store/budgetStore'
import { useLang } from '../LanguageContext'

interface Props {
  store: BudgetStore
  currentYear: number
}

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function AnnualView({ store, currentYear }: Props) {
  const { t } = useLang()

  const chartData = t.monthNames.map((name, i) => {
    const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`
    const monthData = store.months[key]
    if (!monthData) return { name, [t.totalIncome]: 0, [t.totalExpenses]: 0, [t.balance]: 0 }
    const s = computeSummary(monthData)
    return { name, [t.totalIncome]: s.totalIncome, [t.totalExpenses]: s.totalExpenses, [t.balance]: s.balance }
  })

  const totalIncome = chartData.reduce((s, d) => s + (d[t.totalIncome] as number), 0)
  const totalExpenses = chartData.reduce((s, d) => s + (d[t.totalExpenses] as number), 0)
  const avgBalance = chartData.reduce((s, d) => s + (d[t.balance] as number), 0) / 12

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">{t.annualSummary(currentYear)}</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 mb-1">{t.totalAnnualIncome}</p>
          <p className="text-xl font-bold text-green-800">{fmt(totalIncome)} ₪</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 mb-1">{t.totalAnnualExpenses}</p>
          <p className="text-xl font-bold text-red-800">{fmt(totalExpenses)} ₪</p>
        </div>
        <div className={`rounded-xl p-4 border ${avgBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-100 border-red-300'}`}>
          <p className="text-xs text-blue-600 mb-1">{t.avgMonthlyBalance}</p>
          <p className={`text-xl font-bold ${avgBalance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>{fmt(avgBalance)} ₪</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">{t.revenueVsExpenses}</h3>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={75} />
              <Tooltip formatter={(v: number) => `${fmt(v)} ₪`} />
              <Legend />
              <Bar dataKey={t.totalIncome} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t.totalExpenses} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">{t.balanceTrend}</h3>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={75} />
              <Tooltip formatter={(v: number) => `${fmt(v)} ₪`} />
              <Line type="monotone" dataKey={t.balance} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">{t.monthlyTable}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2">{t.month}</th>
                <th className="text-left px-4 py-2">{t.totalIncome}</th>
                <th className="text-left px-4 py-2">{t.totalExpenses}</th>
                <th className="text-left px-4 py-2">{t.balance}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chartData.map((row) => {
                const inc = row[t.totalIncome] as number
                const exp = row[t.totalExpenses] as number
                const bal = row[t.balance] as number
                return (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2 text-green-600 font-medium">{fmt(inc)} ₪</td>
                    <td className="px-4 py-2 text-red-600 font-medium">{fmt(exp)} ₪</td>
                    <td className={`px-4 py-2 font-semibold ${bal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(bal)} ₪</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
