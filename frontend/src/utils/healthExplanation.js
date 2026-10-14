// Plain-language reasons behind a project's health label (On track / Needs attention /
// Urgent), for the "?" next to it. The label itself comes from getProjectHealth; this only
// explains it, and adds other signals (budget, an approaching deadline) as context.
import { daysBetween, toIsoDate } from './calendar.js'
import { formatDate, formatMoney } from './format.js'
import { getBudgetUsage, getProjectHealth, phaseLabel } from './schedule.js'
import { listWords, pluralize } from './text.js'

const SOON_DAYS = 14

function lateMilestoneText(late) {
  return listWords(late.map((m) => `${m.name} (due ${formatDate(m.end_date)})`))
}

/** Why the label is what it is: { headline, reasons: [string] }. */
function labelReasons(project, milestones, phase, todayKey) {
  const { completed = 0, total = 0, overdue = 0 } = project.milestones ?? {}
  const open = total - completed
  const late = milestones
    .filter((m) => !m.completed_at && m.end_date < todayKey)
    .sort((a, b) => a.end_date.localeCompare(b.end_date))

  if (!total) {
    const length = Math.max(1, daysBetween(project.start_date, project.end_date))
    const passed = Math.min(100, Math.max(0, Math.round((daysBetween(project.start_date, todayKey) / length) * 100)))
    return {
      headline: 'No milestones yet',
      reasons: [`So health follows the schedule: ${passed}% of the time from start to predicted end has passed.`],
    }
  }
  if (completed === total) {
    return { headline: 'Every milestone is complete', reasons: ['Nothing is left to deliver.'] }
  }
  if (todayKey > project.end_date) {
    return {
      headline: 'Past its predicted end date',
      reasons: [
        `The predicted end date (${formatDate(project.end_date)}) has passed with ${open} ${pluralize(open, 'milestone')} still open.`,
      ],
    }
  }
  if (overdue === 0) {
    const next = milestones
      .filter((m) => !m.completed_at)
      .sort((a, b) => a.end_date.localeCompare(b.end_date))[0]
    return {
      headline: 'Going as planned',
      reasons: [
        'No milestone is past its end date.',
        ...(next ? [`Next due: ${next.name} on ${formatDate(next.end_date)}.`] : []),
      ],
    }
  }
  const lateLine = late.length
    ? `Past its end date and not completed: ${lateMilestoneText(late)}.`
    : `${overdue} ${pluralize(overdue, 'milestone is', 'milestones are')} past ${pluralize(overdue, 'its', 'their')} end date and not completed.`
  return {
    headline: phase === 'Amber' ? 'A milestone is running late' : 'Several milestones are running late',
    reasons: [lateLine],
  }
}

/** Budget and deadline signals that don't decide the label but are worth knowing. */
function contextNotes(project, todayKey) {
  const notes = []
  const daysLeft = daysBetween(todayKey, project.end_date)
  if (daysLeft >= 0 && daysLeft <= SOON_DAYS) {
    notes.push(`Ends ${daysLeft === 0 ? 'today' : `in ${daysLeft} ${pluralize(daysLeft, 'day')}`} (${formatDate(project.end_date)}).`)
  }
  // Budget and cost only reach admins and managers.
  if (project.cost != null && project.budget) {
    const used = getBudgetUsage(project.cost, project.budget)
    const amounts = `${formatMoney(project.cost)} of ${formatMoney(project.budget)}`
    if (used > 100) notes.push(`Over budget: ${used}% used (${amounts}).`)
    else if (used >= 90) notes.push(`Close to budget: ${used}% used (${amounts}).`)
    else notes.push(`Budget: ${used}% used (${amounts}).`)
  }
  return notes
}

/**
 * { phase, label, headline, reasons, notes } for a project. `milestones` (the project's
 * milestone list) lets late milestones be named; without it the counts are used.
 */
export function explainHealth(project, milestones = [], today = new Date()) {
  const todayKey = toIsoDate(today)
  const phase = getProjectHealth(project, today)
  return {
    phase,
    label: phaseLabel(phase),
    ...labelReasons(project, milestones, phase, todayKey),
    notes: contextNotes(project, todayKey),
  }
}
