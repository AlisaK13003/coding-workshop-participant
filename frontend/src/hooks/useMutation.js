import { useState } from 'react'
import { refreshQueries } from './useApiQuery.js'
import { useToast } from './useToast.js'

/**
 * Runs a change against the API (create, edit, complete…).
 *
 *   const save = useMutation(updateProject, { success: 'Project updated.', onSuccess: onClose })
 *   save.run(project.id, changes)
 *
 * While it runs, `submitting` is true. On success it reloads every query on screen,
 * shows `success` in the toast (text, or a function of (result, ...args)) and calls
 * onSuccess(result, ...args).
 * On failure it shows the error in the toast and keeps the server's per-field
 * messages in `fieldErrors` ({ name: message }). `error` keeps the message when it
 * isn't about particular fields (e.g. a conflict), for the dialog to show.
 */
export function useMutation(action, { success, onSuccess } = {}) {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')

  const run = async (...args) => {
    setSubmitting(true)
    setFieldErrors({})
    setError('')
    let result
    try {
      result = await action(...args)
    } catch (failure) {
      setSubmitting(false)
      setFieldErrors(failure.fields ?? {})
      setError(failure.fields ? '' : failure.message)
      showToast(failure.message, 'error')
      return
    }
    setSubmitting(false)
    refreshQueries()
    if (success) showToast(typeof success === 'function' ? success(result, ...args) : success)
    onSuccess?.(result, ...args)
  }

  return { run, submitting, fieldErrors, error }
}
