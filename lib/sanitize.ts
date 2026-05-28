export function sanitizeString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  const str = String(value)

  const cleaned = str
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || null
}

export function sanitizeRequired(value: unknown, fieldName: string): string {
  const result = sanitizeString(value)
  if (!result) {
    throw new Error(`${fieldName} is required and cannot be empty`)
  }
  return result
}

export function sanitizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = parseFloat(String(value))
  if (isNaN(num) || !isFinite(num)) return null
  return num
}

export function sanitizeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  const date = new Date(String(value))
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

export function sanitizeEmail(value: unknown): string | null {
  const str = sanitizeString(value)
  if (!str) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(str)) return null
  return str.toLowerCase()
}

export function sanitizeId(value: unknown): string | null {
  const str = sanitizeString(value)
  if (!str) return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(str)) return null
  return str
}

const ALLOWED_EMPLOYEE_STATUSES = ['Active', 'On Leave', 'Inactive']
const ALLOWED_APPLICANT_STATUSES = [
  'Applied', 'Under Review', 'Interview Scheduled',
  'Pending Review', 'Hired', 'Rejected'
]

export function sanitizeEmployeeStatus(value: unknown): string | null {
  const str = sanitizeString(value)
  if (!str) return null
  return ALLOWED_EMPLOYEE_STATUSES.includes(str) ? str : null
}

export function sanitizeApplicantStatus(value: unknown): string | null {
  const str = sanitizeString(value)
  if (!str) return null
  return ALLOWED_APPLICANT_STATUSES.includes(str) ? str : null
}

const ALLOWED_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function sanitizeMonth(value: unknown): string | null {
  const str = sanitizeString(value)
  if (!str) return null
  return ALLOWED_MONTHS.includes(str) ? str : null
}

export function sanitizeYear(value: unknown): string | null {
  const str = sanitizeString(value)
  if (!str) return null
  const yearRegex = /^\d{4}$/
  if (!yearRegex.test(str)) return null
  return str
}

export function getFriendlyError(error: unknown): { message: string; status: number } {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'

  if (errorMessage.includes('invalid characters') || errorMessage.includes('Conversion failed')) {
    return {
      message: 'Your input contains invalid characters. Please remove any special symbols, emoji, or unusual characters and try again.',
      status: 400,
    }
  }

  if (errorMessage.includes('Unique constraint') || errorMessage.includes('UNIQUE constraint failed')) {
    return {
      message: 'A record with this information already exists.',
      status: 409,
    }
  }

  if (errorMessage.includes('Record to update') || errorMessage.includes('not found')) {
    return {
      message: 'The requested record was not found.',
      status: 404,
    }
  }

  return {
    message: 'Something went wrong. Please try again.',
    status: 500,
  }
}
