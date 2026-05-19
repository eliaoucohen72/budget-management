export type View = 'dashboard' | 'expenses' | 'income' | 'installments' | 'annual' | 'import' | 'payslip'

interface Props {
  activeView: View
  onViewChange: (v: View) => void
  currentMonth: string
  onPrevMonth: () => void
  onNextMonth: () => void
  hasNextMonth: boolean
  hasPrevMonth: boolean
}

const MONTHLY_TABS: { view: View; label: string }[] = [
  { view: 'dashboard', label: 'Tableau de bord' },
  { view: 'expenses', label: 'Dépenses' },
  { view: 'income', label: 'Revenus' },
  { view: 'installments', label: 'Mensualités' },
]

const GLOBAL_TABS: { view: View; label: string }[] = [
  { view: 'annual', label: 'Annuel' },
  { view: 'import', label: '📥 Importer Excel' },
  { view: 'payslip', label: '🧾 Fiche de paie' },
]

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export default function Navigation({
  activeView,
  onViewChange,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  hasNextMonth,
  hasPrevMonth,
}: Props) {
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4">

        {/* Ligne 1 : titre + sélecteur de mois à droite */}
        <div className="flex items-center justify-between py-3 border-b border-blue-600">
          <h1 className="text-lg font-bold tracking-wide">Budget Familial</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevMonth}
              disabled={!hasPrevMonth}
              className="px-2 py-1 rounded transition text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-blue-600"
              aria-label="Mois précédent"
            >
              ◀
            </button>
            <span className="min-w-[130px] text-center font-semibold text-sm capitalize">
              {formatMonthLabel(currentMonth)}
            </span>
            <button
              onClick={onNextMonth}
              disabled={!hasNextMonth}
              className="px-2 py-1 rounded transition text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-blue-600"
              aria-label="Mois suivant"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Ligne 2 : onglets mensuels à gauche + boutons globaux à droite */}
        <nav className="flex items-center justify-between">
          <div className="flex">
            {MONTHLY_TABS.map(({ view, label }) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                  activeView === view
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-200 hover:text-white hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {GLOBAL_TABS.map(({ view, label }) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeView === view
                    ? 'bg-white text-blue-700'
                    : 'text-blue-200 hover:bg-blue-600 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

      </div>
    </header>
  )
}
