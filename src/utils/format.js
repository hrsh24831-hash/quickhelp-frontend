/**
 * Shared currency formatter — use this everywhere a ₹ value is displayed.
 * Returns a string like "₹1,240.00" using Indian locale formatting.
 *
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  if (isNaN(num)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Compact version — drops the ₹ symbol so you can prefix it yourself.
 * Returns e.g. "1,240.00"
 */
export function formatAmount(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  if (isNaN(num)) return '0.00'
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
