import type { Installment, MonthData } from '../types'

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  monthData: MonthData
}

function ProgressBar({ paid, total }: { paid: number; total: number }) {
  if (total === 0) return <span className="text-gray-400 text-xs">Sans fin</span>
  const pct = Math.min(100, (paid / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[80px]">
        <div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {paid}/{total}
      </span>
    </div>
  )
}

export default function InstallmentTracker({ monthData }: Props) {
  const active = monthData.installments.filter(
    (i) => i.totalMonths === 0 || i.paidMonths < i.totalMonths
  )
  const totalMonthly = active.reduce((s, i) => s + i.monthlyAmount, 0)

  const renderRow = (inst: Installment) => {
    const remaining = inst.totalMonths === 0 ? null : inst.totalMonths - inst.paidMonths
    const totalLeft = remaining !== null ? remaining * inst.monthlyAmount : null

    return (
      <tr key={inst.id} className="hover:bg-gray-50">
        <td className="px-4 py-3 font-medium">{inst.label}</td>
        <td className="px-4 py-3 font-semibold text-purple-600">{fmt(inst.monthlyAmount)} ₪</td>
        <td className="px-4 py-3">
          <ProgressBar paid={inst.paidMonths} total={inst.totalMonths} />
        </td>
        <td className="px-4 py-3 text-gray-500 text-sm">
          {remaining !== null ? `${remaining} mois` : '—'}
        </td>
        <td className="px-4 py-3 text-sm font-medium">
          {totalLeft !== null ? `${fmt(totalLeft)} ₪` : '—'}
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs text-purple-500 mb-1">Total mensuel</p>
          <p className="text-2xl font-bold text-purple-800">{fmt(totalMonthly)} ₪</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-500 mb-1">Mensualités actives</p>
          <p className="text-2xl font-bold text-blue-800">{active.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Mensualités actives</h2>
        </div>
        {active.length === 0 ? (
          <p className="text-gray-400 text-sm p-4">Aucune mensualité active</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2">Description</th>
                  <th className="text-left px-4 py-2">Mensuel</th>
                  <th className="text-left px-4 py-2 min-w-[140px]">Avancement</th>
                  <th className="text-left px-4 py-2">Restant</th>
                  <th className="text-left px-4 py-2">Total restant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">{active.map(renderRow)}</tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
