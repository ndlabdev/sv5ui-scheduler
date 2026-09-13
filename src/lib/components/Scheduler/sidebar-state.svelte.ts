const SLIDE_DURATION = 200

export interface SidebarStateOptions {
    readonly width: () => number
    readonly breakpoint: () => number
    readonly open: () => boolean
    readonly setOpen: (open: boolean) => void
    readonly reducedMotion: () => boolean
}

export class SidebarState {
    overlayOpen = $state(false)
    readonly #options: SidebarStateOptions
    #animates = false

    constructor(options: SidebarStateOptions) {
        this.#options = options
    }

    get docked(): boolean {
        const width = this.#options.width()
        return width === 0 || width >= this.#options.breakpoint()
    }

    get expanded(): boolean {
        return this.docked ? this.#options.open() : this.overlayOpen
    }

    toggle(): void {
        if (this.docked) this.#setOpen(!this.#options.open())
        else this.overlayOpen = !this.overlayOpen
    }

    close(): void {
        if (this.docked) this.#setOpen(false)
        else this.overlayOpen = false
    }

    afterNavigate(): void {
        if (!this.docked) this.overlayOpen = false
    }

    transition(): { axis: 'x'; duration: number } {
        const animated = this.#animates && !this.#options.reducedMotion()
        return { axis: 'x', duration: animated ? SLIDE_DURATION : 0 }
    }

    settled(): void {
        this.#animates = false
    }

    #setOpen(open: boolean): void {
        this.#animates = true
        this.#options.setOpen(open)
    }
}
