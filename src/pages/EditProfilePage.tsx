import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ProjectsService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, User, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const profileSchema = z.object({
  username: z.string().optional(),
  full_name: z.string().optional(),
  bio: z.string().optional(),
  github_url: z.string().url('Please enter a valid GitHub URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
  website_url: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  year_of_study: z.string().optional(),
  department: z.string().optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

const YEAR_OPTIONS = [
  'Freshman',
  'Sophomore', 
  'Junior',
  'Senior',
  'Graduate',
  'Staff',
  'Faculty'
]

const DEPARTMENT_OPTIONS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Liberal Arts & Sciences',
  'Media',
  'Agriculture',
  'Applied Health Sciences',
  'Architecture',
  'Education',
  'Fine & Applied Arts',
  'Information Sciences',
  'Labor & Employment Relations',
  'Law',
  'Medicine',
  'Social Work',
  'Veterinary Medicine',
  'Other'
]

export function EditProfilePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  })

  // Initialize form with current profile data
  useEffect(() => {
    if (profile) {
      setValue('username', profile.username || '')
      setValue('full_name', profile.full_name || '')
      setValue('bio', profile.bio || '')
      setValue('github_url', profile.github_url || '')
      setValue('linkedin_url', profile.linkedin_url || '')
      setValue('website_url', profile.website_url || '')
      setValue('year_of_study', profile.year_of_study || '')
      setValue('department', profile.department || '')
    }
  }, [profile, setValue])

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error } = await ProjectsService.updateUserProfile(user.id, {
        username: data.username || null,
        full_name: data.full_name || null,
        bio: data.bio || null,
        github_url: data.github_url || null,
        linkedin_url: data.linkedin_url || null,
        website_url: data.website_url || null,
        year_of_study: data.year_of_study || null,
        department: data.department || null
      })

      if (error) {
        setError('Failed to update profile. Please try again.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate(`/user/${user.id}`)
        }, 1500)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Navigation */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/user/${user.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
        </Button>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
            <p className="text-gray-600">
              Update your public profile information
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              <p className="font-semibold">Profile Updated Successfully!</p>
              <p className="text-sm">Redirecting to your profile...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Display */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0) || 
                       profile?.username?.charAt(0) || 
                       user.email?.charAt(0) || 
                       '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Profile Photo</p>
                    <p className="text-sm text-gray-600">
                      Avatar is synced with your Google account
                    </p>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      {...register('full_name')}
                      placeholder="Your full name"
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...register('username')}
                      placeholder="@username"
                    />
                    {errors.username && (
                      <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...register('bio')}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                  {errors.bio && (
                    <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
                  )}
                </div>

                {/* Academic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year_of_study">Year of Study</Label>
                    <Select 
                      value={watch('year_of_study') || ''} 
                      onValueChange={(value) => setValue('year_of_study', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year of study" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEAR_OPTIONS.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      value={watch('department') || ''} 
                      onValueChange={(value) => setValue('department', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENT_OPTIONS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Social Links</h3>
                  
                  <div>
                    <Label htmlFor="website_url">Personal Website</Label>
                    <Input
                      id="website_url"
                      {...register('website_url')}
                      placeholder="https://yourwebsite.com"
                      type="url"
                    />
                    {errors.website_url && (
                      <p className="text-sm text-red-600 mt-1">{errors.website_url.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="github_url">GitHub Profile</Label>
                    <Input
                      id="github_url"
                      {...register('github_url')}
                      placeholder="https://github.com/yourusername"
                      type="url"
                    />
                    {errors.github_url && (
                      <p className="text-sm text-red-600 mt-1">{errors.github_url.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                    <Input
                      id="linkedin_url"
                      {...register('linkedin_url')}
                      placeholder="https://linkedin.com/in/yourusername"
                      type="url"
                    />
                    {errors.linkedin_url && (
                      <p className="text-sm text-red-600 mt-1">{errors.linkedin_url.message}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6">
                  <Button type="button" variant="outline" asChild>
                    <Link to={`/user/${user.id}`}>
                      Cancel
                    </Link>
                  </Button>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}