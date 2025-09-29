import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

export interface CarouselProps {
  children: React.ReactNode[]
  itemsPerPage?: number
  spacing?: number
  showDots?: boolean
  showArrows?: boolean
  autoplay?: boolean
  autoplayInterval?: number
  loop?: boolean
  className?: string
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  itemsPerPage = 1,
  spacing = 16,
  showDots = true,
  showArrows = true,
  autoplay = false,
  autoplayInterval = 3000,
  loop = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const totalPages = Math.ceil(children.length / itemsPerPage)

  const scrollPage = useCallback((pageIndex: number) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const itemWidth = container.clientWidth / itemsPerPage
    const targetScroll = pageIndex * itemWidth + spacing * pageIndex

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })

    setCurrentPage(pageIndex)
  }, [itemsPerPage, spacing])

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      scrollPage(currentPage + 1)
    } else if (loop) {
      scrollPage(0)
    }
  }, [currentPage, totalPages, scrollPage, loop])

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      scrollPage(currentPage - 1)
    } else if (loop) {
      scrollPage(totalPages - 1)
    }
  }, [currentPage, totalPages, scrollPage, loop])

  // Touch handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].pageX - containerRef.current!.offsetLeft)
    setScrollLeft(containerRef.current!.scrollLeft)
    setIsPaused(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return

    e.preventDefault()
    const x = e.touches[0].pageX - containerRef.current!.offsetLeft
    const walk = (x - startX) * 2
    containerRef.current!.scrollLeft = scrollLeft - walk
  }, [isDragging, startX, scrollLeft])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setIsPaused(false)

    if (!containerRef.current) return

    const container = containerRef.current
    const itemWidth = container.clientWidth / itemsPerPage
    const currentScroll = container.scrollLeft
    const nearestPage = Math.round(currentScroll / (itemWidth + spacing))

    scrollPage(Math.min(Math.max(nearestPage, 0), totalPages - 1))
  }, [itemsPerPage, spacing, totalPages, scrollPage])

  // Autoplay
  useEffect(() => {
    if (!autoplay || isPaused) return

    const interval = setInterval(() => {
      nextPage()
    }, autoplayInterval)

    return () => clearInterval(interval)
  }, [autoplay, autoplayInterval, nextPage, isPaused])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      scrollPage(currentPage)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentPage, scrollPage])

  // Pause autoplay on hover
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false)
  }, [])

  return (
    <div className={`relative w-full ${className}`}>
      {/* Carousel container */}
      <div
        ref={containerRef}
        className="flex overflow-x-hidden scroll-smooth snap-x snap-mandatory touch-pan-x"
        style={{
          gap: `${spacing}px`,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0 snap-start"
            style={{
              width: `calc(${100 / itemsPerPage}% - ${spacing * (itemsPerPage - 1) / itemsPerPage}px)`,
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {showArrows && totalPages > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevPage}
            disabled={!loop && currentPage === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextPage}
            disabled={!loop && currentPage === totalPages - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollPage(index)}
              className={`
                w-2 h-2 rounded-full transition-colors
                ${index === currentPage
                  ? 'bg-primary-600 dark:bg-primary-400'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

Carousel.displayName = 'Carousel'