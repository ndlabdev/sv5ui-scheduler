import { beforeEach, vi } from 'vitest'
import '../routes/layout.css'
import { NOW } from './fixtures/dom.js'

beforeEach(() => {
    vi.setSystemTime(NOW)
})
