import './ReviewDetail.css'

/** Two-column grid of small labelled facts. items: [{ label, value }]. */
export function ReviewDetail({ items }) {
  return (
    <div className="review-detail">
      {items.map(({ label, value }) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}
