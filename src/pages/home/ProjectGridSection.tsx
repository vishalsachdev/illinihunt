import { ProjectGrid } from '@/components/project/ProjectGrid'
import { RecentActivityFeed } from '@/components/RecentActivityFeed'

interface ProjectGridSectionProps {
  selectedCategory: string
}

export function ProjectGridSection({ selectedCategory }: ProjectGridSectionProps) {
  return (
    <div id="projects-section" className="container mx-auto p-4 py-20 bg-midnight">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Projects Grid */}
        <div className="lg:col-span-3">
          <ProjectGrid selectedCategory={selectedCategory} />
        </div>

        {/* Community Activity Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-premium rounded-2xl p-6 sticky top-4 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-orange shadow-lg shadow-neon-orange/50"></span>
              </span>
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
