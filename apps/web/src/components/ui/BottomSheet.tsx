import React, { useRef, useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { useFocusTrap, useAnnouncement } from '@/utils/accessibility'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  height?: 'auto' | 'half' | 'full'
  dismissible?: boolean
  showDragHandle?: boolean
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  dismissible = true,
  showDragHandle = true,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const { announce } = useAnnouncement()

  const heightClasses = {
    auto: 'h-auto max-h-[80vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]',
  }

  // Focus trap
  useFocusTrap(isOpen)

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!dismissible) return

    const touch = event.touches[0]
    setStartY(touch.clientY)
    setIsDragging(true)
  }, [dismissible])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isDragging || !dismissible) return

    const touch = event.touches[0]
    const deltaY = touch.clientY - startY

    if (deltaY > 0) {
      setCurrentY(deltaY)
    }
  }, [isDragging, startY, dismissible])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !dismissible) return

    setIsDragging(false)

    if (currentY > 100) {
      handleClose()
    } else {
      setCurrentY(0)
    }
  }, [isDragging, currentY, dismissible])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    announce('Bottom sheet closed')
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setCurrentY(0)
    }, 300)
  }, [onClose, announce])

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (dismissible && event.target === event.currentTarget) {
      handleClose()
    }
  }, [dismissible, handleClose])

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !dismissible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, dismissible, handleClose])

  // Touch event listeners
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet || !isOpen) return

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true })
    sheet.addEventListener('touchmove', handleTouchMove, { passive: true })
    sheet.addEventListener('touchend', handleTouchEnd)

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart)
      sheet.removeEventListener('touchmove', handleTouchMove)
      sheet.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = '0'
      document.body.style.width = '100%'

      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`
          relative w-full bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl
          ${heightClasses[height]}
          transition-transform duration-300 ease-out
          ${isClosing ? 'translate-y-full' : 'translate-y-0'}
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{
          transform: isDragging ? `translateY(${currentY}px)` : undefined,
        }}
      >
        {/* Drag Handle */}
        {showDragHandle && (
          <div
            className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full cursor-grab active:cursor-grabbing"
          />
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                aria-label="Close bottom sheet"
                className="flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="overflow-y-auto"
          style={{ maxHeight: height === 'auto' ? 'calc(80vh - 100px)' : undefined }}
        >
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

BottomSheet.displayName = 'BottomSheet'