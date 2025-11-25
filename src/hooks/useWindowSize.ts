import { useState, useEffect, useRef } from 'react'

interface WindowSize {
  width: number
  height: number
}

/**
 * Optimized window size hook with debouncing to prevent excessive re-renders
 * Debounces resize events by 150ms to improve performance during window resizing
 */
export function useWindowSize(debounceMs: number = 150): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function handleResize() {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Debounce the state update to prevent excessive re-renders
      timeoutRef.current = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }, debounceMs)
    }

    // Add event listener with passive option for better scroll performance
    window.addEventListener('resize', handleResize, { passive: true })

    // Call handler right away so state gets updated with initial window size
    // Don't debounce the initial call
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [debounceMs])

  return windowSize
}