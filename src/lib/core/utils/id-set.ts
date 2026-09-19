const EMPTY: ReadonlySet<string> = new Set()

export function emptyIdSet(): ReadonlySet<string> {
    return EMPTY
}

export function withId(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
    if (set.has(id)) return set
    const next = new Set(set)
    next.add(id)
    return next
}

export function withoutId(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
    if (!set.has(id)) return set
    const next = new Set(set)
    next.delete(id)
    return next
}
