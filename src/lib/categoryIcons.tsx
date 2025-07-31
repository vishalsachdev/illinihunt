import { 
  GraduationCap, 
  Users, 
  Calendar, 
  Heart, 
  Palette, 
  BarChart, 
  TrendingUp, 
  Zap,
  LucideIcon 
} from 'lucide-react'

// Mapping of icon names (stored in database) to Lucide React components
export const categoryIconMap: Record<string, LucideIcon> = {
  'GraduationCap': GraduationCap,
  'Users': Users,
  'Calendar': Calendar,
  'Heart': Heart,
  'Palette': Palette,
  'BarChart': BarChart,
  'TrendingUp': TrendingUp,
  'Zap': Zap,
}

// Helper function to get icon component from icon name
export function getCategoryIcon(iconName: string | null): LucideIcon | null {
  if (!iconName) return null
  return categoryIconMap[iconName] || null
}

// Helper component to render category icon
interface CategoryIconProps {
  iconName: string | null
  className?: string
  fallback?: string
}

export function CategoryIcon({ iconName, className = "w-4 h-4", fallback }: CategoryIconProps) {
  const IconComponent = getCategoryIcon(iconName)
  
  if (IconComponent) {
    return <IconComponent className={className} />
  }
  
  // Fallback to first letter if no icon found
  if (fallback) {
    return <span className={className}>{fallback.charAt(0)}</span>
  }
  
  return null
}