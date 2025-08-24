'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { BotIcon, ArrowLeftIcon, SettingsIcon, UserIcon, LockIcon, BellIcon, CheckCircle2Icon, AlertCircleIcon } from '@/components/icons'
import { api, authUtils } from '@/lib/api'

interface UserSettings {
  id: string
  name: string
  email: string
  company?: string
  notifications: {
    emailUpdates: boolean
    securityAlerts: boolean
    usageAlerts: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userResponse = await api.me()
      
      if (userResponse.user) {
        setUser(userResponse.user)
        
        // Create default settings structure
        setSettings({
          id: userResponse.user.id,
          name: userResponse.user.name,
          email: userResponse.user.email,
          company: userResponse.user.company,
          notifications: {
            emailUpdates: true,
            securityAlerts: true,
            usageAlerts: true
          },
          preferences: {
            theme: 'dark',
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
      setError('Failed to load user settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    try {
      setIsSaving(true)
      setError('')

      await api.updateProfile({
        name: settings.name,
        company: settings.company
      })

      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await api.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      setSuccessMessage('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationUpdate = async (type: keyof UserSettings['notifications'], value: boolean) => {
    if (!settings) return

    try {
      const updatedSettings = {
        ...settings,
        notifications: {
          ...settings.notifications,
          [type]: value
        }
      }
      
      setSettings(updatedSettings)
      
      await api.updateNotificationSettings(updatedSettings.notifications)
      
      setSuccessMessage('Notification preferences updated!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update notification settings')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await api.deleteAccount()
      
      authUtils.removeToken()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to delete account')
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: LockIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="btn-hover"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Dashboard
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <SettingsIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">Settings</h1>
                    <p className="text-sm text-muted-foreground">
                      Manage your account and preferences
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading settings...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-card p-4 rounded-xl border border-border/50 card-shadow">
                  <nav className="space-y-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{tab.name}</span>
                        </button>
                      )
                    })}
                  </nav>
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-3">
                <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl mb-6">
                      <div className="flex items-center">
                        <AlertCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6">
                      <div className="flex items-center">
                        <CheckCircle2Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-sm">{successMessage}</span>
                      </div>
                    </div>
                  )}

                  {/* Profile Tab */}
                  {activeTab === 'profile' && settings && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="name" className="form-label">Full Name</label>
                              <input
                                id="name"
                                type="text"
                                value={settings.name}
                                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                className="form-input"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="email" className="form-label">Email Address</label>
                              <input
                                id="email"
                                type="email"
                                value={settings.email}
                                className="form-input opacity-50"
                                disabled
                              />
                              <p className="text-xs text-muted-foreground">
                                Email cannot be changed. Contact support if needed.
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="company" className="form-label">Company (Optional)</label>
                            <input
                              id="company"
                              type="text"
                              value={settings.company || ''}
                              onChange={(e) => setSettings({ ...settings, company: e.target.value })}
                              className="form-input"
                              placeholder="Your company name"
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={isSaving}
                            className="btn-hover"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="currentPassword" className="form-label">Current Password</label>
                            <input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              className="form-input"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="newPassword" className="form-label">New Password</label>
                            <input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              className="form-input"
                              minLength={8}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                            <input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              className="form-input"
                              minLength={8}
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={isSaving}
                            className="btn-hover"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Changing...
                              </>
                            ) : (
                              'Change Password'
                            )}
                          </Button>
                        </form>
                      </div>

                      <div className="border-t border-border/50 pt-6">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
                        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                          <h4 className="font-medium mb-2">Delete Account</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <Button
                            variant="outline"
                            onClick={handleDeleteAccount}
                            disabled={isSaving}
                            className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            {isSaving ? 'Deleting...' : 'Delete Account'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && settings && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-3">
                            <div>
                              <h4 className="font-medium">Email Updates</h4>
                              <p className="text-sm text-muted-foreground">
                                Receive notifications about product updates and new features
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.notifications.emailUpdates}
                                onChange={(e) => handleNotificationUpdate('emailUpdates', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between py-3">
                            <div>
                              <h4 className="font-medium">Security Alerts</h4>
                              <p className="text-sm text-muted-foreground">
                                Get notified about security-related events and suspicious activity
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.notifications.securityAlerts}
                                onChange={(e) => handleNotificationUpdate('securityAlerts', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between py-3">
                            <div>
                              <h4 className="font-medium">Usage Alerts</h4>
                              <p className="text-sm text-muted-foreground">
                                Receive alerts when you're approaching your plan limits
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.notifications.usageAlerts}
                                onChange={(e) => handleNotificationUpdate('usageAlerts', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}