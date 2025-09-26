import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-bold text-uiuc-blue mb-2">Page not found</h1>
        <p className="text-gray-600 mb-6">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild className="bg-uiuc-orange hover:bg-uiuc-orange/90">
            <Link to="/">Go to homepage</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/submit">Submit a project</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
