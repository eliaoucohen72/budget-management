import { useState, useRef } from 'react'
import { parseExcelFile, type ImportResult, type ExcelFileResult } from '../utils/excelImport'
import { generateTemplate } from '../utils/templateGenerator'
import { useLang } from '../LanguageContext'

interface Props {
  onImport: (result: ExcelFileResult) => void
}

type Step = 'idle' | 'preview' | 'done'

export default function ImportExcel({ onImport }: Props) {
  const { t, lang } = useLang()
  const [step, setStep] = useState<Step>('idle')
  const [fileResult, setFileResult] = useState<ExcelFileResult | null>(null)
  const [results, setResults] = useState<ImportResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set())
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleFile = async (file: File) => {
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseExcelFile(buffer)
      if (parsed.months.length === 0) {
        setError(t.importError)
        return
      }
      setFileResult(parsed)
      setResults(parsed.months)
      setSelectedMonths(new Set(parsed.months.map((r) => r.monthKey)))
      setStep('preview')
    } catch (e) {
      setError(t.importReadError(e instanceof Error ? e.message : String(e)))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const toggleMonth = (key: string) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleConfirm = () => {
    if (!fileResult) return
    const toImport = results.filter((r) => selectedMonths.has(r.monthKey))
    onImport({ months: toImport, savings: fileResult.savings, savingsExpenses: fileResult.savingsExpenses })
    setStep('done')
  }

  const handleReset = () => {
    setStep('idle')
    setFileResult(null)
    setResults([])
    setError(null)
    setSelectedMonths(new Set())
    setExpandedMonth(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (step === 'done') {
    return (
      <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center space-y-3">
        <div className="text-4xl">✅</div>
        <p className="font-semibold text-green-800 text-lg">{t.importSuccess(selectedMonths.size)}</p>
        <button onClick={handleReset} className="text-sm text-green-700 underline hover:text-green-900">
          {t.importAnother}
        </button>
      </div>
    )
  }

  if (step === 'preview') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">{t.importPreviewTitle}</h2>
          <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-600">
            {t.chooseAnother}
          </button>
        </div>

        <p className="text-sm text-gray-500">
          {t.importWarning} <strong>{t.importWarningBold}</strong>.
        </p>

        <div className="space-y-3">
          {results.map((r) => {
            const selected = selectedMonths.has(r.monthKey)
            const expanded = expandedMonth === r.monthKey
            const totalExp = r.monthData.expenses.reduce((s, e) => s + e.amount, 0)
            const totalInst = r.monthData.installments.reduce((s, i) => s + i.monthlyAmount, 0)
            const totalInc = r.monthData.incomes.reduce((s, i) => s + i.amount, 0)

            return (
              <div
                key={r.monthKey}
                className={`border rounded-xl overflow-hidden transition ${
                  selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleMonth(r.monthKey)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="font-semibold text-gray-800 flex-1">{r.monthKey}</span>
                  <span className="text-xs text-gray-500 hidden md:flex gap-4">
                    <span className="text-red-600">{r.monthData.expenses.length} {t.navExpenses.toLowerCase()}</span>
                    <span className="text-purple-600">{r.monthData.installments.length} {t.navInstallments.toLowerCase()}</span>
                    <span className="text-green-600">{r.monthData.incomes.length} {t.navIncome.toLowerCase()}</span>
                  </span>
                  <button
                    onClick={() => setExpandedMonth(expanded ? null : r.monthKey)}
                    className="text-xs text-blue-500 hover:text-blue-700 ml-2"
                  >
                    {expanded ? t.close : t.details}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 px-4 pb-3 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {t.incomeLabel} {fmt(totalInc)} ₪
                  </span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    {t.navExpenses} {fmt(totalExp)} ₪
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {t.installmentsLabel} {fmt(totalInst)} ₪/mois
                  </span>
                </div>

                {expanded && (
                  <div className="border-t border-gray-200 bg-white px-4 py-3 space-y-4 text-sm">
                    {r.monthData.incomes.length > 0 && (
                      <div>
                        <p className="font-medium text-green-700 mb-1">{t.incomeLabel}</p>
                        <table className="w-full text-xs">
                          <tbody className="divide-y divide-gray-100">
                            {r.monthData.incomes.map((inc) => (
                              <tr key={inc.id}>
                                <td className="py-1">{inc.source}</td>
                                <td className="py-1 font-semibold text-green-600">{fmt(inc.amount)} ₪</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {r.monthData.expenses.filter((e) => e.type === 'fixed').length > 0 && (
                      <div>
                        <p className="font-medium text-blue-700 mb-1">{t.fixedLabel}</p>
                        <table className="w-full text-xs">
                          <tbody className="divide-y divide-gray-100">
                            {r.monthData.expenses.filter((e) => e.type === 'fixed').map((e) => (
                              <tr key={e.id}>
                                <td className="py-1">{e.label}</td>
                                <td className="py-1 font-semibold text-red-600">{fmt(e.amount)} ₪</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {r.monthData.installments.length > 0 && (
                      <div>
                        <p className="font-medium text-purple-700 mb-1">{t.installmentsLabel}</p>
                        <table className="w-full text-xs">
                          <tbody className="divide-y divide-gray-100">
                            {r.monthData.installments.map((inst) => (
                              <tr key={inst.id}>
                                <td className="py-1">{inst.label}</td>
                                <td className="py-1 text-gray-400">{inst.paidMonths}/{inst.totalMonths || '∞'}</td>
                                <td className="py-1 font-semibold text-purple-600">{fmt(inst.monthlyAmount)} ₪</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {r.monthData.expenses.filter((e) => e.type === 'variable').length > 0 && (
                      <div>
                        <p className="font-medium text-amber-700 mb-1">{t.variableLabel}</p>
                        <table className="w-full text-xs">
                          <tbody className="divide-y divide-gray-100">
                            {r.monthData.expenses.filter((e) => e.type === 'variable').map((e) => (
                              <tr key={e.id}>
                                <td className="py-1">{e.label}</td>
                                <td className="py-1 font-semibold text-red-600">{fmt(e.amount)} ₪</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleConfirm}
            disabled={selectedMonths.size === 0}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.importBtn(selectedMonths.size)}
          </button>
          <button onClick={handleReset} className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition">
            {t.cancel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">{t.importTitle}</h2>
        <p className="text-sm text-gray-500">{t.importDesc}</p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
      >
        <div className="text-5xl mb-3">📊</div>
        <p className="font-semibold text-gray-700">{t.dropZoneTitle}</p>
        <p className="text-sm text-gray-400 mt-1">{t.dropZoneSubtitle}</p>
        <p className="text-xs text-gray-300 mt-3">.xlsx · .xls</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      {/* Template download */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {lang === 'fr' ? 'Nouveau utilisateur ?' : 'New user?'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === 'fr'
              ? 'Télécharge un fichier Excel pré-formaté prêt à remplir.'
              : 'Download a pre-formatted Excel file ready to fill in.'}
          </p>
        </div>
        <button
          onClick={generateTemplate}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition whitespace-nowrap"
        >
          📄 {lang === 'fr' ? 'Télécharger le template' : 'Download template'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
