/**
 * LogiPredict AI - Formatting Utilities
 */

/**
 * Format a number as Indian Rupee or standard currency
 * @param {number} value
 * @param {string} [currency='INR']
 * @param {number} [maximumFractionDigits=0]
 * @returns {string}
 */
export function formatCurrency(value, currency = 'INR', maximumFractionDigits = 0) {
  if (value === null || value === undefined || isNaN(value)) return '—';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Format a number with compact notation (e.g. 1.2k, 4.5M)
 * @param {number} value
 * @returns {string}
 */
export function formatCompactNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0';

  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format a number with standard commas (e.g. 12,450)
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format a percentage value
 * @param {number} value - e.g. 94.2 or 0.942 depending on isDecimal
 * @param {boolean} [isDecimal=false]
 * @returns {string}
 */
export function formatPercent(value, isDecimal = false) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  const num = isDecimal ? value * 100 : value;
  return `${num >= 0 ? '' : ''}${num.toFixed(1)}%`;
}

/**
 * Format a date object or ISO string to standard enterprise format (e.g. "02 Oct 2026, 14:30")
 * @param {string|Date} dateInput
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
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Relative time formatter (e.g. "5m ago", "2h ago", "Just now")
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}
