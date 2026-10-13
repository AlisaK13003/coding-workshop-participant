import './Tabs.css'

/** Underlined tab bar. tabs is a list of names; onChange receives the clicked name. */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((name) => (
        <button
          key={name}
          className={name === active ? 'active' : undefined}
          onClick={() => onChange(name)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
