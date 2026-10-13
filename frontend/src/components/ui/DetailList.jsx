import './DetailList.css'

/** Two-column label/value list. items: [{ label, value }]. */
export function DetailList({ items }) {
  return (
    <dl className="detail-list">
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
