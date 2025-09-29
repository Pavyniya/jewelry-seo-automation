import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { useFocusTrap, useAnnouncement, generateId } from '@/utils/accessibility'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  initialFocus?: 'none' | 'close-button' | 'first-focusable'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  initialFocus = 'close-button',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { announce } = useAnnouncement()

  const titleId = generateId('modal-title')
  const descriptionId = generateId('modal-description')

  // Focus trap
  useFocusTrap(isOpen)

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        announce('Modal closed')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, onClose, announce])

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
      announce('Modal closed')
    }
  }

  // Set initial focus
  useEffect(() => {
    if (!isOpen) return

    const focusElement = () => {
      switch (initialFocus) {
        case 'close-button':
          closeButtonRef.current?.focus()
          break
        case 'first-focusable':
          const firstFocusable = modalRef.current?.querySelector(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement
          firstFocusable?.focus()
          break
        case 'none':
        default:
          // Don't focus anything
          break
      }
    }

    // Use requestAnimationFrame to ensure the modal is in the DOM
    requestAnimationFrame(focusElement)

    // Announce modal opening
    announce(`Modal opened: ${title}`)
  }, [isOpen, initialFocus, title, announce])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Save the current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'

      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <Card
        ref={modalRef}
        className={`${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-xl`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold text-gray-900 dark:text-white pr-4"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-gray-600 dark:text-gray-400"
              >
                {description}
              </p>
            )}
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close modal"
            className="flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </Card>
    </div>
  )
}

Modal.displayName = 'Modal'