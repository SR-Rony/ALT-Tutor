export type AssessmentWindowState = 'NOT_OPEN' | 'OPEN' | 'LATE' | 'CLOSED';

export type AssessmentScheduleFields = {
  status?: string | null;
  availableFrom?: string | Date | null;
  availableUntil?: string | Date | null;
  dueDate?: string | Date | null;
};

function toTime(value?: string | Date | null) {
  if (!value) return null;
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Mirrors backend assertAssessmentWindowOpen for student UI badges / disable logic.
 * LATE = past dueDate but still before availableUntil (when set).
 */
export function getAssessmentWindowState(
  assignment: AssessmentScheduleFields,
  now = Date.now(),
): AssessmentWindowState {
  const status = String(assignment.status ?? 'PUBLISHED').toUpperCase();
  if (status === 'DRAFT' || status === 'CLOSED') return 'CLOSED';

  const from = toTime(assignment.availableFrom);
  const until = toTime(assignment.availableUntil);
  const due = toTime(assignment.dueDate);

  if (from != null && from > now) return 'NOT_OPEN';
  if (until != null && until < now) return 'CLOSED';
  if (due != null && due < now) {
    if (until != null && until >= now) return 'LATE';
    if (until == null) return 'CLOSED';
  }
  return 'OPEN';
}

export function assessmentWindowLabel(state: AssessmentWindowState) {
  switch (state) {
    case 'NOT_OPEN':
      return 'Not open yet';
    case 'LATE':
      return 'Late window';
    case 'CLOSED':
      return 'Closed';
    default:
      return 'Open';
  }
}

export function canSubmitAssessment(state: AssessmentWindowState) {
  return state === 'OPEN' || state === 'LATE';
}
