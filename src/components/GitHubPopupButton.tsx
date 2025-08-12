import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GitHubPopupButton() {
  const handleClick = () => {
    window.open('https://github.com/vishalsachdev/illinihunt', '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-uiuc-blue hover:bg-uiuc-orange shadow-lg hover:shadow-xl transition-all duration-200 border-0 focus:ring-2 focus:ring-uiuc-orange focus:ring-offset-2"
      size="icon"
      aria-label="Visit GitHub Repository"
      title="Visit GitHub Repository"
    >
      <Github className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
    </Button>
  )
}