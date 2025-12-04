import { useMemo } from 'react'

interface YouTubeEmbedProps {
  url: string
  title?: string
  className?: string
}

/**
 * Safely embeds YouTube videos with proper validation
 * Only accepts YouTube URLs and extracts video ID
 */
export function YouTubeEmbed({ url, title = 'YouTube video', className = '' }: YouTubeEmbedProps) {
  const videoId = useMemo(() => {
    if (!url) return null

    try {
      // Support various YouTube URL formats:
      // - https://www.youtube.com/watch?v=VIDEO_ID
      // - https://youtu.be/VIDEO_ID
      // - https://www.youtube.com/embed/VIDEO_ID
      const urlObj = new URL(url)

      // Check if it's a valid YouTube domain
      const validDomains = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']
      if (!validDomains.includes(urlObj.hostname)) {
        return null
      }

      // Extract video ID based on URL format
      if (urlObj.hostname === 'youtu.be') {
        // Format: https://youtu.be/VIDEO_ID
        return urlObj.pathname.slice(1).split('?')[0]
      } else if (urlObj.pathname.includes('/embed/')) {
        // Format: https://www.youtube.com/embed/VIDEO_ID
        return urlObj.pathname.split('/embed/')[1].split('?')[0]
      } else {
        // Format: https://www.youtube.com/watch?v=VIDEO_ID
        return urlObj.searchParams.get('v')
      }
    } catch {
      // Invalid URL
      return null
    }
  }, [url])

  if (!videoId) {
    return null
  }

  // Validate video ID format (alphanumeric, underscore, hyphen, 11 chars)
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return null
  }

  // Construct safe embed URL
  const embedUrl = `https://www.youtube.com/embed/${videoId}`

  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full rounded-lg border-2 border-gray-200"
        loading="lazy"
      />
    </div>
  )
}
