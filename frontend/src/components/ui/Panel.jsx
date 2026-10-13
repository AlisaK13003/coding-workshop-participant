import { cx } from '../../utils/cx.js'
import './Panel.css'

/** Title row of a panel: heading, optional description, optional actions on the right. */
export function SectionHead({ title, description, actions }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </div>
  )
}

/** White card section. Pass `title` to render a SectionHead above the content. */
export function Panel({ title, description, actions, className, children }) {
  return (
    <section className={cx('panel', className)}>
      {title && (
        <SectionHead title={title} description={description} actions={actions} />
      )}
      {children}
    </section>
  )
}
