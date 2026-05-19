import { useState, useRef } from 'react'
import { parsePayslipPDF, type PayslipData } from '../utils/payslipImport'

interface Props {
  onImport: (monthKey: string, source: string, amount: number) => void
}

type Step = 'idle' | 'preview' | 'done'

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ImportPayslip({ onImport }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [data, setData] = useState<PayslipData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editedAmount, setEditedAmount] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const parsed = await parsePayslipPDF(buffer)
      setData(parsed)
      setEditedAmount(parsed.netSalary.toFixed(2))
      setStep('preview')
    } catch (e) {
      setError(`Erreur de lecture : ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleConfirm = () => {
    if (!data) return
    const amount = parseFloat(editedAmount)
    if (isNaN(amount) || amount <= 0) return
    onImport(data.monthKey, data.source, amount)
    setStep('done')
  }

  const handleReset = () => {
    setStep('idle')
    setData(null)
    setError(null)
    setEditedAmount('')
    if (inputRef.current) inputRef.current.value = ''
  }

  if (step === 'done') {
    return (
      <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center space-y-3">
        <div className="text-4xl">✅</div>
        <p className="font-semibold text-green-800">Fiche de paie importée avec succès</p>
        <button onClick={handleReset} className="text-sm text-green-700 underline hover:text-green-900">
          Importer une autre fiche
        </button>
      </div>
    )
  }

  if (step === 'preview' && data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">Fiche de paie détectée</h2>
          <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-600">
            ← Choisir un autre fichier
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Mois</p>
              <p className="font-semibold text-gray-800">{data.monthKey}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Employeur</p>
              <p className="font-semibold text-gray-800">{data.source}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Salaire net détecté</p>
            <p className="text-2xl font-bold text-green-600">{fmt(data.netSalary)} ₪</p>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Montant à enregistrer (modifiable)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={editedAmount}
                onChange={(e) => setEditedAmount(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40 font-semibold"
              />
              <span className="text-gray-500">₪</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Ce montant sera ajouté comme revenu pour le mois <strong>{data.monthKey}</strong>.
          Les revenus existants ne seront pas supprimés.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700 transition"
          >
            Enregistrer le revenu
          </button>
          <button
            onClick={handleReset}
            className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Importer une fiche de paie</h2>
        <p className="text-sm text-gray-500">
          Le salaire net sera extrait automatiquement et ajouté aux revenus du mois concerné.
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-green-300 rounded-2xl p-12 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
      >
        <div className="text-5xl mb-3">🧾</div>
        <p className="font-semibold text-gray-700">Glissez votre fiche de paie ici</p>
        <p className="text-sm text-gray-400 mt-1">ou cliquez pour choisir un fichier</p>
        <p className="text-xs text-gray-300 mt-3">.pdf</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
