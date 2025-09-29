import React from 'react'

// Keyboard navigation utilities
export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const

// ARIA roles
export const AriaRoles = {
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  APPLICATION: 'application',
  ARTICLE: 'article',
  BANNER: 'banner',
  BUTTON: 'button',
  CELL: 'cell',
  CHECKBOX: 'checkbox',
  COLUMNHEADER: 'columnheader',
  COMBOBOX: 'combobox',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  DEFINITION: 'definition',
  DIALOG: 'dialog',
  DIRECTORY: 'directory',
  DOCUMENT: 'document',
  FEED: 'feed',
  FIGURE: 'figure',
  FORM: 'form',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  GROUP: 'group',
  HEADING: 'heading',
  IMG: 'img',
  LINK: 'link',
  LIST: 'list',
  LISTBOX: 'listbox',
  LISTITEM: 'listitem',
  LOG: 'log',
  MAIN: 'main',
  MARQUEE: 'marquee',
  MATH: 'math',
  MENU: 'menu',
  MENUBAR: 'menubar',
  MENUITEM: 'menuitem',
  MENUITEMCHECKBOX: 'menuitemcheckbox',
  MENUITEMRADIO: 'menuitemradio',
  NAVIGATION: 'navigation',
  NONE: 'none',
  NOTE: 'note',
  OPTION: 'option',
  PRESENTATION: 'presentation',
  PROGRESSBAR: 'progressbar',
  RADIO: 'radio',
  RADIOGROUP: 'radiogroup',
  REGION: 'region',
  ROW: 'row',
  ROWGROUP: 'rowgroup',
  ROWHEADER: 'rowheader',
  SCROLLBAR: 'scrollbar',
  SEARCH: 'search',
  SEPARATOR: 'separator',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  STATUS: 'status',
  SWITCH: 'switch',
  TAB: 'tab',
  TABLE: 'table',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  TERM: 'term',
  TEXTBOX: 'textbox',
  TIMER: 'timer',
  TOOLBAR: 'toolbar',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEGRID: 'treegrid',
  TREEITEM: 'treeitem',
} as const

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ')

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== Keys.TAB) return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          event.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          event.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  static focusFirst(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container)
    focusableElements[0]?.focus()
  }

  static focusLast(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container)
    const lastElement = focusableElements[focusableElements.length - 1]
    lastElement?.focus()
  }
}

// Announce messages to screen readers
export class Announcer {
  private static announcer: HTMLDivElement | null = null

  private static getAnnouncer(): HTMLDivElement {
    if (!this.announcer) {
      this.announcer = document.createElement('div')
      this.announcer.setAttribute('aria-live', 'polite')
      this.announcer.setAttribute('aria-atomic', 'true')
      this.announcer.setAttribute('aria-hidden', 'false')
      this.announcer.style.position = 'absolute'
      this.announcer.style.left = '-10000px'
      this.announcer.style.width = '1px'
      this.announcer.style.height = '1px'
      this.announcer.style.overflow = 'hidden'
      document.body.appendChild(this.announcer)
    }
    return this.announcer
  }

  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = this.getAnnouncer()
    announcer.setAttribute('aria-live', priority)

    // Clear previous content
    announcer.textContent = ''

    // Force reflow
    announcer.offsetHeight

    // Set new content
    announcer.textContent = message
  }

  static clear(): void {
    const announcer = this.getAnnouncer()
    announcer.textContent = ''
  }
}

// Keyboard event handlers
export const Keyboard = {
  isActivationKey(event: React.KeyboardEvent): boolean {
    return event.key === Keys.ENTER || event.key === Keys.SPACE
  },

  isNavigationKey(event: React.KeyboardEvent): boolean {
    return [
      Keys.ARROW_UP,
      Keys.ARROW_DOWN,
      Keys.ARROW_LEFT,
      Keys.ARROW_RIGHT,
      Keys.HOME,
      Keys.END,
      Keys.PAGE_UP,
      Keys.PAGE_DOWN,
    ].includes(event.key)
  },

  isEscapeKey(event: React.KeyboardEvent): boolean {
    return event.key === Keys.ESCAPE
  },

  isTabKey(event: React.KeyboardEvent): boolean {
    return event.key === Keys.TAB
  },

  preventDefaultIfNotHandled(event: React.KeyboardEvent, handled: boolean): void {
    if (!handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  },
}

// Screen reader detection
export function useScreenReader(): boolean {
  const [isScreenReader, setIsScreenReader] = React.useState(false)

  React.useEffect(() => {
    // Create a hidden element to test for screen reader
    const testElement = document.createElement('div')
    testElement.setAttribute('aria-hidden', 'true')
    testElement.textContent = 'screen reader test'
    testElement.style.position = 'absolute'
    testElement.style.left = '-10000px'
    document.body.appendChild(testElement)

    // Check if the element is read by screen reader
    const checkInterval = setInterval(() => {
      // This is a simple heuristic - in practice, you'd want more sophisticated detection
      const computedStyle = window.getComputedStyle(testElement)
      const isHidden = computedStyle.display === 'none' ||
                     computedStyle.visibility === 'hidden' ||
                     computedStyle.opacity === '0'

      setIsScreenReader(isHidden)
    }, 100)

    // Clean up after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval)
      document.body.removeChild(testElement)
    }, 5000)

    return () => {
      clearInterval(checkInterval)
      if (testElement.parentNode) {
        document.body.removeChild(testElement)
      }
    }
  }, [])

  return isScreenReader
}

// Reduced motion detection
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// High contrast detection
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setPrefersHighContrast(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHighContrast
}

// Color scheme detection
export function useColorScheme(): 'light' | 'dark' {
  const [colorScheme, setColorScheme] = React.useState<'light' | 'dark'>('light')

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setColorScheme(mediaQuery.matches ? 'dark' : 'light')

    const handleChange = (event: MediaQueryListEvent) => {
      setColorScheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return colorScheme
}

// Accessibility hooks
export function useFocusTrap(isActive: boolean): React.RefObject<HTMLDivElement> {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!isActive || !ref.current) return

    const cleanup = FocusManager.trapFocus(ref.current)
    return cleanup
  }, [isActive])

  return ref
}

export function useAnnouncement(): {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  clear: () => void
} {
  return {
    announce: Announcer.announce,
    clear: Announcer.clear,
  }
}

// Generate unique IDs for accessibility
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

// Accessible component patterns are available as separate components in the components directory