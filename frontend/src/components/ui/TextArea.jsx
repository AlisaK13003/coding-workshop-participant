import './forms.css'

/** Multi-line text control. Extra props reach the <textarea>. */
export function TextArea(props) {
  return <textarea className="control textarea-control" {...props} />
}
