"use client"

import { useEffect, useState } from "react"
import { Toaster } from "@/components/ui/toaster"

/**
 * Client-only Toaster wrapper to prevent hydration mismatches
 * This ensures the Toaster only renders on the client side
 */
export function ClientToaster() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <Toaster />
}
