import { useState } from 'react'
import type { ExpenseCategory, MonthData } from '../types'
import { useLang } from '../LanguageContext'

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  monthData: MonthData
}

const TABS = [
  { id: 'fixed' as const, labelKey: 'fixed' as const },
  { id: 'variable' as const, labelKey: 'variable' as const },
  { id: 'installments' as const, labelKey: 'installments' as const },
]

type Tab = 'fixed' | 'variable' | 'installments'

export default function ExpenseForm({ monthData }: Props) {
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>('variable')

  const categoryLabels: Record<ExpenseCategory, string> = {
    rent: t.catRent, transport: t.catTransport, insurance: t.catInsurance,
    education: t.catEducation, groceries: t.catGroceries, pharmacy: t.catPharmacy,
    restaurant: t.catRestaurant, clothing: t.catClothing, gifts: t.catGifts, other: t.catOther,
  }

  const TAB_LABELS: Record<Tab, string> = {
    fixed: t.fixed,
    variable: t.variable,
    installments: t.installments,
  }

  const fixedExpenses = monthData.expenses.filter((e) => e.type === 'fixed')
  const variableExpenses = monthData.expenses.filter((e) => e.type === 'variable')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[t.id]}
          </button>
        ))}
      </div>

      {(tab === 'fixed' || tab === 'variable') && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">
              {tab === 'fixed' ? t.fixedExpenses : t.variableExpenses}
            </h2>
            <span className="text-sm text-gray-500">
              {fmt((tab === 'fixed' ? fixedExpenses : variableExpenses).reduce((s, e) => s + e.amount, 0))} ₪
            </span>
          </div>
          {(tab === 'fixed' ? fixedExpenses : variableExpenses).length === 0 ? (
            <p className="text-gray-400 text-sm p-4">{t.noEntries}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2">{t.description}</th>
                  <th className="text-left px-4 py-2">{t.category}</th>
                  <th className="text-left px-4 py-2">{t.amount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(tab === 'fixed' ? fixedExpenses : variableExpenses).map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{e.label}</td>
                    <td className="px-4 py-2 text-gray-500">{categoryLabels[e.category]}</td>
                    <td className="px-4 py-2 font-semibold text-red-600">{fmt(e.amount)} ₪</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'installments' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">{t.installmentsInProgress}</h2>
          </div>
          {monthData.installments.length === 0 ? (
            <p className="text-gray-400 text-sm p-4">{t.noInstallments}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2">{t.description}</th>
                  <th className="text-left px-4 py-2">{t.monthly}</th>
                  <th className="text-left px-4 py-2">{t.progress}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthData.installments.map((inst) => {
                  const isComplete = inst.totalMonths > 0 && inst.paidMonths >= inst.totalMonths
                  return (
                    <tr key={inst.id} className={`hover:bg-gray-50 ${isComplete ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2 font-medium">
                        {inst.label}
                        {isComplete && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-1 rounded">{t.completed}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-semibold text-purple-600">{fmt(inst.monthlyAmount)} ₪</td>
                      <td className="px-4 py-2 text-gray-500">
                        {inst.totalMonths === 0 ? t.openMonths(inst.paidMonths) : `${inst.paidMonths}/${inst.totalMonths}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
