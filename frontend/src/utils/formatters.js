/**
 * LogiPredict AI — Centralized Formatting Utilities
 * ==================================================
 * Consistent number, currency, percentage, date, and relative-time formatting
 * for dashboards, tables, charts, and alert displays.
 *
 * Locale  : en-IN (Indian number/date conventions)
 * Timezone: IST (Asia/Kolkata) stored as ISO 8601, displayed as IST
 */

// ──────────────────────────────────────────────────────────────────────
// NUMBER FORMATTING
// ──────────────────────────────────────────────────────────────────────

/**
 * Format an integer with Indian comma notation (e.g. 12,480 → "12,480")
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN').format(Math.round(Number(value)));
}

/**
 * Format a decimal number with up to N fraction digits (e.g. 94.2 → "94.2")
 * @param {number|null|undefined} value
 * @param {number} [fractionDigits=1]
 * @returns {string}
 */
export function formatDecimal(value, fractionDigits = 1) {
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value));
}

/**
 * Format a percentage (e.g. 94.2 → "94.2%" or 0.942 → "94.2%" if isDecimal=true)
 * @param {number|null|undefined} value
 * @param {boolean} [isDecimal=false] - if true, multiply by 100
 * @param {number} [fractionDigits=1]
 * @returns {string}
 */
export function formatPercent(value, isDecimal = false, fractionDigits = 1) {
  if (value === null || value === undefined || isNaN(Number(value))) return '—%';
  const num = isDecimal ? Number(value) * 100 : Number(value);
  return `${num.toFixed(fractionDigits)}%`;
}

/**
 * Format a large number with compact notation (e.g. 12,000 → "12k")
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatCompactNumber(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return '0';
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(Number(value));
}

/**
 * Format as Indian Rupee currency (e.g. 4800000 → "₹48,00,000")
 * @param {number|null|undefined} value
 * @param {string} [currency='INR']
 * @param {number} [maximumFractionDigits=0]
 * @returns {string}
 */
export function formatCurrency(value, currency = 'INR', maximumFractionDigits = 0) {
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(Number(value));
}

/**
 * Format a quantity with a unit suffix (e.g. 3200, "Liters" → "3,200 Liters")
 * @param {number|null|undefined} value
 * @param {string} unit
 * @returns {string}
 */
export function formatQuantity(value, unit = '') {
  const num = formatNumber(value);
  if (num === '—') return '—';
  return unit ? `${num} ${unit}` : num;
}

/**
 * Format decimal transit hours into human-readable hours & minutes (e.g. 6.8 → "6h 48m", 1.5 → "1h 30m", 0.5 → "30m")
 * @param {number|null|undefined} hours
 * @returns {string}
 */
export function formatTransitHours(hours) {
  if (hours === null || hours === undefined || isNaN(Number(hours))) return '—';
  const totalMinutes = Math.round(Number(hours) * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return `${hrs}h`;
  }
  return `${hrs}h ${mins}m`;
}

/**
 * Format distance in kilometers (e.g. 204 → "204 km")
 * @param {number|null|undefined} km
 * @returns {string}
 */
export function formatDistance(km) {
  if (km === null || km === undefined || isNaN(Number(km))) return '— km';
  return `${formatDecimal(km, 0)} km`;
}


// ──────────────────────────────────────────────────────────────────────
// DATE / TIME FORMATTING
// ──────────────────────────────────────────────────────────────────────

/**
 * Format date as "02 Oct 2026" or "02 Oct 2026, 14:30" if includeTime = true
 * @param {string|Date|null|undefined} dateInput
 * @param {boolean} [includeTime=false]
 * @returns {string}
 */
export function formatDate(dateInput, includeTime = false) {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '—';

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' } : {}),
  };
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Format a time-only string (HH:mm:ss IST) from a Date or ISO string
 * @param {string|Date|null|undefined} dateInput
 * @returns {string}
 */
export function formatTime(dateInput) {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

/**
 * Format a full ISO datetime string for display (e.g. "02 Oct 2026, 14:30 IST")
 * @param {string|Date|null|undefined} dateInput
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '—';
  return `${formatDate(date, true)} IST`;
}

/**
 * Relative time formatter anchored to a FIXED demo baseline (2026-10-02T09:15:00Z IST).
 * This keeps relative timestamps stable in SIH 2026 demo mode rather than drifting.
 *
 * @param {string|Date|null|undefined} dateInput
 * @returns {string} e.g. "12 mins ago", "2 hrs ago", "Just now"
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '—';

  // Demo baseline — frozen at dashboard operational "now"
  const DEMO_NOW = new Date('2026-10-02T09:15:00Z');
  const diffInSeconds = Math.floor((DEMO_NOW.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0) return 'Upcoming';
  if (diffInSeconds < 120) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}

/**
 * Days-until formatter (e.g. "In 3 days", "Today", "Overdue")
 * Anchored to the SIH 2026 demo baseline of 2026-10-02.
 * @param {string|null|undefined} isoDateString
 * @returns {string}
 */
export function formatDaysUntil(isoDateString) {
  if (!isoDateString) return '—';
  const target = new Date(isoDateString);
  if (isNaN(target.getTime())) return '—';
  const DEMO_TODAY = new Date('2026-10-02');
  const diffMs = target.getTime() - DEMO_TODAY.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}
