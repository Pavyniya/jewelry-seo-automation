import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useAnnouncement, generateId } from '@/utils/accessibility'

export interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
  disabled?: boolean
  defaultOpen?: boolean
}

export interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  defaultOpenItems?: string[]
  onChange?: (openItems: string[]) => void
  variant?: 'default' | 'bordered' | 'separated'
}

const variantClasses = {
  default: {
    container: 'divide-y divide-gray-200 dark:divide-gray-700',
    item: 'border-0',
    button: 'w-full flex items-center justify-between py-4 px-0 text-left',
  },
  bordered: {
    container: 'space-y-2',
    item: 'border border-gray-200 dark:border-gray-700 rounded-lg',
    button: 'w-full flex items-center justify-between p-4 text-left rounded-lg',
  },
  separated: {
    container: 'space-y-4',
    item: 'border-b border-gray-200 dark:border-gray-700 pb-4',
    button: 'w-full flex items-center justify-between pb-2 text-left',
  },
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpenItems = [],
  onChange,
  variant = 'default',
}) => {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpenItems)
  const { announce } = useAnnouncement()

  const toggleItem = (itemId: string) => {
    const isOpen = openItems.includes(itemId)
    let newOpenItems: string[]

    if (allowMultiple) {
      newOpenItems = isOpen
        ? openItems.filter(id => id !== itemId)
        : [...openItems, itemId]
    } else {
      newOpenItems = isOpen ? [] : [itemId]
    }

    setOpenItems(newOpenItems)
    onChange?.(newOpenItems)

    // Announce state change
    const item = items.find(i => i.id === itemId)
    if (item) {
      announce(`${item.title} section ${isOpen ? 'collapsed' : 'expanded'}`)
    }
  }

  const handleKeyDown = (
    event: React.KeyboardEvent,
    itemId: string,
    index: number
  ) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        toggleItem(itemId)
        break
      case 'ArrowDown':
        event.preventDefault()
        const nextButton = event.currentTarget
          .closest('[role="heading"]')
          ?.nextElementSibling
          ?.querySelector('button')
        nextButton?.focus()
        break
      case 'ArrowUp':
        event.preventDefault()
        const prevButton = event.currentTarget
          .closest('[role="heading"]')
          ?.previousElementSibling
          ?.querySelector('button')
        prevButton?.focus()
        break
      case 'Home':
        event.preventDefault()
        const firstButton = document.querySelector(
          '[data-accordion-item] button'
        ) as HTMLButtonElement
        firstButton?.focus()
        break
      case 'End':
        event.preventDefault()
        const buttons = document.querySelectorAll(
          '[data-accordion-item] button'
        )
        const lastButton = buttons[buttons.length - 1] as HTMLButtonElement
        lastButton?.focus()
        break
    }
  }

  return (
    <div className="w-full">
      {items.map((item, index) => {
        const isOpen = openItems.includes(item.id)
        const buttonId = generateId(`accordion-button-${item.id}`)
        const panelId = generateId(`accordion-panel-${item.id}`)

        return (
          <div
            key={item.id}
            data-accordion-item
            className={variantClasses[variant].item}
          >
            <h3 role="heading" aria-level={3}>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-disabled={item.disabled}
                disabled={item.disabled}
                onClick={() => !item.disabled && toggleItem(item.id)}
                onKeyDown={(e) => !item.disabled && handleKeyDown(e, item.id, index)}
                className={`
                  ${variantClasses[variant].button}
                  text-gray-900 dark:text-white
                  hover:text-gray-700 dark:hover:text-gray-300
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                `}
              >
                <span className="font-medium">{item.title}</span>
                <div className="ml-4 flex-shrink-0">
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  )}
                </div>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={`
                ${variant === 'default' ? 'pb-4' : variant === 'bordered' ? 'px-4 pb-4' : ''}
                overflow-hidden
                transition-all duration-200 ease-in-out
                ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              <div className="text-gray-700 dark:text-gray-300">
                {item.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

Accordion.displayName = 'Accordion'