import React, { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { usePWA } from '@/hooks/usePWA'

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, installPWA } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  // Check if user has previously dismissed the prompt
  useEffect(() => {
    const isDismissed = localStorage.getItem('pwa-install-dismissed')
    if (isDismissed) {
      setDismissed(true)
    }
  }, [])

  const handleInstall = async () => {
    await installPWA()
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if not installable, already dismissed, or already installed
  if (!isInstallable || dismissed) return null

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 shadow-xl border border-gray-200 dark:border-gray-700 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Install Jewelry SEO Automation
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Install our app on your device for quick access and offline support.
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              className="flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Install
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="flex-shrink-0"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

PWAInstallPrompt.displayName = 'PWAInstallPrompt'