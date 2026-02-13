/**
 * Copies text to the clipboard
 * Returns a promise that resolves to true on success, false on failure
 */
export async function copyToClipboard(text) {
    if (!text) return false
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback for older browsers / non-HTTPS environments
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        return true
      } catch {
        return false
      }
    }
  }
  
  /**
   * Combines class name strings, filtering out falsy values
   * Works like a lightweight clsx
   * Usage: classNames('base', isActive && 'active', error ? 'error' : '')
   */
  export function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }
  
  /**
   * Formats a number with commas and fixed decimals
   * e.g. 1500.5 → "1,500.5000"
   */
  export function formatAmount(amount, decimals = 4) {
    if (amount === null || amount === undefined) return '0.0000'
    const num = Number(amount)
    if (isNaN(num)) return '0.0000'
  
    // toFixed gives us the decimal portion
    const fixed = num.toFixed(decimals)
  
    // Split into integer and decimal parts
    const [intPart, decPart] = fixed.split('.')
  
    // Add commas to the integer part
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
    return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas
  }
  
  /**
   * Returns a promise that resolves after ms milliseconds
   * Used in polling loops to add delays between retries
   */
  export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }