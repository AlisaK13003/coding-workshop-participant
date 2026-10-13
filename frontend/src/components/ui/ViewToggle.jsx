import './ViewToggle.css'

/**
 * Segmented control for switching views (e.g. table / cards, month / timeline).
 * options: [{ value, label?, icon?, ariaLabel? }]; onChange receives the value.
 */
export function ViewToggle({ options, value, onChange }) {
  return (
    <div className="view-toggle">
      {options.map(({ value: optionValue, label, icon: Icon, ariaLabel }) => (
        <button
          key={optionValue}
          className={optionValue === value ? 'active' : undefined}
          onClick={() => onChange(optionValue)}
          aria-label={ariaLabel}
          aria-pressed={optionValue === value}
        >
          {Icon ? <Icon size={16} /> : label}
        </button>
      ))}
    </div>
  )
}
