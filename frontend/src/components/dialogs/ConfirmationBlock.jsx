import './dialogs.css'

/** Icon, bold question and explanation shown at the top of a confirmation dialog. */
export function ConfirmationBlock({ icon: Icon, title, children }) {
  return (
    <div className="confirmation-block">
      <Icon size={24} />
      <p>
        <strong>{title}</strong>
        <span>{children}</span>
      </p>
    </div>
  )
}
