"use client"

import { useEffect, useState } from "react"

export type FocssResolvedScheme = "light" | "dark"

function readFocssScheme(): FocssResolvedScheme {
  if (typeof document === "undefined") return "light"
  const root = document.documentElement
  if (root.classList.contains("dark")) return "dark"
  if (root.getAttribute("data-color-scheme") === "dark") return "dark"
  return "light"
}

export function useFocssResolvedScheme(): FocssResolvedScheme {
  const [scheme, setScheme] = useState<FocssResolvedScheme>(readFocssScheme)

  useEffect(() => {
    function sync() {
      setScheme(readFocssScheme())
    }

    const observer = new MutationObserver(sync)

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-color-scheme"],
    })

    return () => observer.disconnect()
  }, [])

  return scheme
}
