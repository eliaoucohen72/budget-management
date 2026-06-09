import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { SavingsProject } from '../types'
import { useLang } from '../LanguageContext'

interface Props {
  projects: SavingsProject[]
}

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function groupByMonth(entries: { date: string; amount: number }[], lang: string): { month: string; total: number }[] {
  const map: Record<string, number> = {}
  for (const e of entries) {
    const month = e.date.slice(0, 7)
    map[month] = (map[month] ?? 0) + e.amount
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({
      month: new Date(month + '-01').toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'short', year: '2-digit' }),
      total,
    }))
}

export default function SavingsView({ projects }: Props) {
  const { t, lang } = useLang()
  const [selectedName, setSelectedName] = useState<string>(() => projects[0]?.name ?? '')

  const project = projects.find((p) => p.name === selectedName) ?? projects[0]
  const savings = project?.entries ?? []
  const plannedExpenses = project?.expenses ?? []

  const totalSaved = savings.reduce((s, e) => s + e.amount, 0)
  const totalPlanned = plannedExpenses.reduce((s, e) => s + e.amount, 0)
  const remaining = totalPlanned - totalSaved
  const byMonth = groupByMonth(savings, lang)
  const sorted = [...savings].sort((a, b) => b.date.localeCompare(a.date))

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
        {t.noSavingsData}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800">{t.savingsTitle}</h2>
        {projects.length > 1 && (
          <select
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {projects.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-emerald-600 mb-1">{t.totalSaved}</p>
          <p className="text-2xl font-bold text-emerald-800">{fmt(totalSaved)} ₪</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-500 mb-1">{t.plannedBudget}</p>
          <p className="text-2xl font-bold text-blue-800">{fmt(totalPlanned)} ₪</p>
        </div>
        <div className={`rounded-xl p-4 border ${remaining > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-xs mb-1 ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {remaining > 0 ? t.stillMissing : t.surplus}
          </p>
          <p className={`text-2xl font-bold ${remaining > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {fmt(Math.abs(remaining))} ₪
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">{t.savingsByMonth}</h3>
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMonth} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => v.toLocaleString('fr-FR')} tick={{ fontSize: 11 }} width={65} />
                <Tooltip formatter={(v: number) => `${fmt(v)} ₪`} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {byMonth.map((_, i) => <Cell key={i} fill="#10b981" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">{t.plannedExpenses}</h3>
          {plannedExpenses.length === 0 ? (
            <p className="text-gray-400 text-sm">{t.noPlannedExpenses}</p>
          ) : (
            <div className="space-y-2">
              {plannedExpenses.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={e.paid}
                      disabled
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <span className={`text-sm font-medium ${e.paid ? 'line-through text-gray-400' : 'text-gray-700'}`}>{e.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${e.paid ? 'text-gray-400' : 'text-gray-800'}`}>{fmt(e.amount)} ₪</span>
                </div>
              ))}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{t.savedSoFar(fmt(totalSaved))}</span>
                  <span>{t.needed(fmt(totalPlanned))}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, (totalSaved / totalPlanned) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-center mt-1 text-gray-500">
                  {totalPlanned > 0 ? `${((totalSaved / totalPlanned) * 100).toFixed(0)}%` : '—'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">{t.detailTable}</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2">{t.date}</th>
              <th className="text-left px-4 py-2">{t.amount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((e, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-600">{e.date}</td>
                <td className="px-4 py-2 font-semibold text-emerald-600">{fmt(e.amount)} ₪</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
