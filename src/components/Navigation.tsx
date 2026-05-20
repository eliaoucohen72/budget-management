import { useLang } from '../LanguageContext'

export type View = 'dashboard' | 'expenses' | 'income' | 'installments' | 'annual' | 'import' | 'savings'

interface Props {
  activeView: View
  onViewChange: (v: View) => void
  currentMonth: string
  onPrevMonth: () => void
  onNextMonth: () => void
  hasNextMonth: boolean
  hasPrevMonth: boolean
}

function formatMonthLabel(key: string, lang: string): string {
  const [year, month] = key.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })
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
  const { t, lang, setLang } = useLang()

  const MONTHLY_TABS: { view: View; label: string }[] = [
    { view: 'dashboard', label: t.navDashboard },
    { view: 'expenses', label: t.navExpenses },
    { view: 'income', label: t.navIncome },
    { view: 'installments', label: t.navInstallments },
  ]

  const GLOBAL_TABS: { view: View; label: string }[] = [
    { view: 'savings', label: t.navSavings },
    { view: 'annual', label: t.navAnnual },
    { view: 'import', label: t.navImport },
  ]

  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4">
        {/* Ligne 1 : titre + sélecteur de mois + langue */}
        <div className="flex items-center justify-between py-3 border-b border-blue-600">
          <h1 className="text-lg font-bold tracking-wide">{t.appTitle}</h1>

          <div className="flex items-center gap-1">
            <button
              onClick={onPrevMonth}
              disabled={!hasPrevMonth}
              className="px-2 py-1 rounded transition text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-blue-600"
              aria-label={t.prevMonth}
            >
              ◀
            </button>
            <span className="min-w-[130px] text-center font-semibold text-sm capitalize">
              {formatMonthLabel(currentMonth, lang)}
            </span>
            <button
              onClick={onNextMonth}
              disabled={!hasNextMonth}
              className="px-2 py-1 rounded transition text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-blue-600"
              aria-label={t.nextMonth}
            >
              ▶
            </button>
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-1 bg-blue-600 rounded-lg p-0.5">
            <button
              onClick={() => setLang('fr')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${lang === 'fr' ? 'bg-white text-blue-700' : 'text-blue-200 hover:text-white'}`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${lang === 'en' ? 'bg-white text-blue-700' : 'text-blue-200 hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Ligne 2 : onglets mensuels + globaux */}
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
