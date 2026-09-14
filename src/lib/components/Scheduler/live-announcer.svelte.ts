export class LiveAnnouncer {
    message = $state('')
    #toggle = false

    announce(text: string): void {
        this.#toggle = !this.#toggle
        this.message = this.#toggle ? text : `${text} `
    }
}
