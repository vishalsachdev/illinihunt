import { ProjectGrid } from '@/components/project/ProjectGrid'
import { RecentActivityFeed } from '@/components/RecentActivityFeed'

interface ProjectGridSectionProps {
  selectedCategory: string
}

export function ProjectGridSection({ selectedCategory }: ProjectGridSectionProps) {
  return (
    <div id="projects-section" className="container mx-auto p-4 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Projects Grid */}
        <div className="lg:col-span-3">
          <ProjectGrid selectedCategory={selectedCategory} />
        </div>

        {/* Community Activity Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-green-500">●</span>
              Recent Activity
            </h3>
            <RecentActivityFeed />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectGridSection
