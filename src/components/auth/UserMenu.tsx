import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, LogOut, LayoutDashboard, FolderOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export function UserMenu() {
  const { user, profile, signOut } = useAuth()

  if (!profile) return null

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      // Sign out errors are handled by the auth hook
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label="User menu" className="relative h-10 w-10 rounded-full hover:bg-white/10 ring-2 ring-white/10 hover:ring-neon-orange/50 transition-all duration-300">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
            <AvatarFallback className="bg-gradient-to-br from-neon-orange to-neon-blue text-white font-bold text-sm">
              {profile.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {profile.full_name && (
              <p className="font-medium">{profile.full_name}</p>
            )}
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="flex items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/collections" className="flex items-center">
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>Collections</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/user/${user?.id}`} className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>View Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}