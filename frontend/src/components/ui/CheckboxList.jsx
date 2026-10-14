import './forms.css'
import './CheckboxList.css'

/**
 * A labelled group of checkboxes, styled like a form field. Each checked box submits
 * its value under `name`, so a form reads them with formData.getAll(name).
 * options: [{ value, label, detail? }]; defaultValues: values checked at first.
 */
export function CheckboxList({ label, name, options, defaultValues = [], hint, error, emptyText = 'Nothing to choose.' }) {
  return (
    <fieldset className="field checkbox-list">
      <legend>{label}</legend>
      {options.length ? (
        <div className="checkbox-options">
          {options.map((option) => (
            <label key={option.value} className="checkbox-option">
              <input
                type="checkbox"
                name={name}
                value={option.value}
                defaultChecked={defaultValues.includes(option.value)}
              />
              <span>
                {option.label}
                {option.detail && <small>{option.detail}</small>}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <small>{emptyText}</small>
      )}
      {hint && !error && <small>{hint}</small>}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </fieldset>
  )
}
