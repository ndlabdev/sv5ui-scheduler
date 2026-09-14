const warned = new Set<string>()

export function warnOnce(key: string, message: string): void {
    if (!import.meta.env.DEV || warned.has(key)) return
    warned.add(key)
    console.warn(`[@sv5ui/scheduler] ${message}`)
}

export function resetWarnings(): void {
    warned.clear()
}
