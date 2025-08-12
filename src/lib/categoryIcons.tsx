/* eslint-disable react-refresh/only-export-components */
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
    try {
      return <IconComponent className={className} />
    } catch (error) {
      console.warn('Error rendering category icon:', error)
      // Fall through to fallback
    }
  }
  
  // Fallback to first letter if no icon found or icon fails to render
  if (fallback) {
    return (
      <span 
        className={`${className} inline-flex items-center justify-center bg-gray-200 text-gray-600 rounded text-xs font-medium`}
        style={{ minWidth: '1rem', minHeight: '1rem' }}
      >
        {fallback.charAt(0).toUpperCase()}
      </span>
    )
  }
  
  // Ultimate fallback
  return (
    <span 
      className={`${className} inline-flex items-center justify-center bg-gray-200 text-gray-600 rounded text-xs`}
      style={{ minWidth: '1rem', minHeight: '1rem' }}
    >
      ?
    </span>
  )
}