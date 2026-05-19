import type { MonthData } from '../types'
import { CATEGORY_LABELS } from '../types'

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  monthData: MonthData
}

const TABS = [
  { id: 'fixed', label: 'Fixes' },
  { id: 'variable', label: 'Variables' },
  { id: 'installments', label: 'Mensualités' },
] as const

type Tab = (typeof TABS)[number]['id']

import { useState } from 'react'

export default function ExpenseForm({ monthData }: Props) {
  const [tab, setTab] = useState<Tab>('variable')

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
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'fixed' || tab === 'variable') && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">
              Dépenses {tab === 'fixed' ? 'fixes' : 'variables'}
            </h2>
            <span className="text-sm text-gray-500">
              {fmt(
                (tab === 'fixed' ? fixedExpenses : variableExpenses).reduce(
                  (s, e) => s + e.amount, 0
                )
              )}{' '}₪
            </span>
          </div>
          {(tab === 'fixed' ? fixedExpenses : variableExpenses).length === 0 ? (
            <p className="text-gray-400 text-sm p-4">Aucune entrée</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2">Description</th>
                  <th className="text-left px-4 py-2">Catégorie</th>
                  <th className="text-left px-4 py-2">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(tab === 'fixed' ? fixedExpenses : variableExpenses)
                  .map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{e.label}</td>
                      <td className="px-4 py-2 text-gray-500">{CATEGORY_LABELS[e.category]}</td>
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
            <h2 className="font-semibold text-gray-700">Mensualités en cours</h2>
          </div>
          {monthData.installments.length === 0 ? (
            <p className="text-gray-400 text-sm p-4">Aucune mensualité</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2">Description</th>
                  <th className="text-left px-4 py-2">Mensuel</th>
                  <th className="text-left px-4 py-2">Avancement</th>
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
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-1 rounded">
                            Terminé
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-semibold text-purple-600">
                        {fmt(inst.monthlyAmount)} ₪
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {inst.totalMonths === 0
                          ? `${inst.paidMonths} mois (ouvert)`
                          : `${inst.paidMonths}/${inst.totalMonths}`}
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
