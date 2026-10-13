import './ReviewIcon.css'

/** Amber round icon marking a milestone review. icon is a lucide-react component. */
export function ReviewIcon({ icon: Icon, size = 18 }) {
  return (
    <span className="review-icon">
      <Icon size={size} />
    </span>
  )
}
