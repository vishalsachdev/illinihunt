import DOMPurify from 'dompurify'

/**
 * Sanitizes user-generated content to prevent XSS attacks
 * Allows basic formatting like line breaks but removes potentially dangerous HTML
 */
export function sanitizeContent(content: string): string {
  if (!content) return ''
  
  // Configure DOMPurify to allow basic formatting
  const cleanContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  })
  
  return cleanContent.trim()
}

/**
 * Sanitizes URLs to prevent javascript: and data: schemes
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''
  
  const trimmedUrl = url.trim()
  
  // Block dangerous URL schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:']
  const lowerUrl = trimmedUrl.toLowerCase()
  
  for (const scheme of dangerousSchemes) {
    if (lowerUrl.startsWith(scheme)) {
      return ''
    }
  }
  
  // Only allow http, https, and mailto
  if (trimmedUrl.match(/^https?:\/\//) || trimmedUrl.match(/^mailto:/)) {
    return trimmedUrl
  }
  
  // If no protocol, assume https for safety
  if (trimmedUrl.match(/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/)) {
    return `https://${trimmedUrl}`
  }
  
  return ''
}

/**
 * Convert URLs in text to clickable links
 * Specifically handles "View our pitch deck" links and general URLs
 */
export function linkifyText(text: string): string {
  if (!text) return ''
  
  // First, handle the specific "View our pitch deck" pattern
  let linkedText = text.replace(
    /📊 \*\*View our pitch deck\*\*: (https?:\/\/[^\s]+)/g,
    '📊 <a href="$1" target="_blank" rel="noopener noreferrer" class="text-uiuc-blue hover:text-uiuc-orange underline font-semibold">View our pitch deck</a>'
  )
  
  // Then handle any remaining URLs that aren't already linked
  linkedText = linkedText.replace(
    /(?<!href=["'])(https?:\/\/[^\s<>"]+)(?![^<]*<\/a>)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-uiuc-blue hover:text-uiuc-orange underline">$1</a>'
  )
  
  return linkedText
}