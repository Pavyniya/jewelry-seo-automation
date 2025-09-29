import { useState, useEffect } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export interface PushSubscriptionOptions {
  userVisibleOnly: boolean
  applicationServerKey: Uint8Array
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful')
          setServiceWorkerRegistration(registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing
            installingWorker?.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                console.log('New content is available; please refresh.')
              }
            })
          })
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed:', error)
        })
    }
  }, [])

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      const promptEvent = event as BeforeInstallPromptEvent
      setInstallPrompt(promptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Install PWA
  const installPWA = async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
      }

      setInstallPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Failed to install PWA:', error)
    }
  }

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.error('Notifications not supported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  // Subscribe to push notifications
  const subscribeToPushNotifications = async () => {
    if (!serviceWorkerRegistration) return null

    try {
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      })
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  // Unsubscribe from push notifications
  const unsubscribeFromPushNotifications = async () => {
    if (!serviceWorkerRegistration) return

    try {
      const subscription = await serviceWorkerRegistration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
    }
  }

  // Show notification
  const showNotification = (payload: NotificationPayload) => {
    if (!('Notification' in window) || notificationPermission !== 'granted') {
      return
    }

    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/badge.png',
      data: payload.data,
      actions: payload.actions,
      requireInteraction: true,
    })
  }

  // Check for updates
  const checkForUpdates = async () => {
    if (!serviceWorkerRegistration) return

    try {
      await serviceWorkerRegistration.update()
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }

  // Sync data
  const syncData = async () => {
    if (!serviceWorkerRegistration) return

    try {
      await serviceWorkerRegistration.sync.register('sync-failed-requests')
    } catch (error) {
      console.error('Failed to register sync:', error)
    }
  }

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installPWA,
    notificationPermission,
    requestNotificationPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    showNotification,
    checkForUpdates,
    syncData,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}