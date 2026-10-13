import './Phase.css'

/** Schedule phase dot and label. value: 'Green' | 'Amber' | 'Red'. */
export function Phase({ value }) {
  return (
    <span className="phase">
      <i className={`phase-dot phase-${value.toLowerCase()}`} />
      {value}
    </span>
  )
}
