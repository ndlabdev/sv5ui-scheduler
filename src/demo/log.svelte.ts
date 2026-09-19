export type LogColor =
    'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' | 'surface'

export interface LogEntry {
    id: number
    time: string
    label: string
    detail?: string
    color: LogColor
}

const clock = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
})

export class EventLog {
    entries = $state.raw<LogEntry[]>([])
    readonly #limit: number
    #next = 0

    constructor(limit = 60) {
        this.#limit = limit
    }

    add(label: string, detail?: string, color: LogColor = 'surface'): void {
        this.#next += 1
        const time = clock.format(Date.now())
        const entry = { id: this.#next, time, label, detail, color }
        this.entries = [entry, ...this.entries].slice(0, this.#limit)
    }

    clear(): void {
        this.entries = []
    }
}
