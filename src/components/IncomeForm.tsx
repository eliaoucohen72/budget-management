import type { MonthData } from '../types'

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  monthData: MonthData
}

export default function IncomeForm({ monthData }: Props) {
  const total = monthData.incomes.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Revenus du mois</h2>
          <span className="text-sm font-semibold text-green-600">{fmt(total)} ₪</span>
        </div>
        {monthData.incomes.length === 0 ? (
          <p className="text-gray-400 text-sm p-4">Aucun revenu enregistré</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2">Source</th>
                <th className="text-left px-4 py-2">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthData.incomes.map((inc) => (
                <tr key={inc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{inc.source}</td>
                  <td className="px-4 py-2 font-semibold text-green-600">{fmt(inc.amount)} ₪</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
