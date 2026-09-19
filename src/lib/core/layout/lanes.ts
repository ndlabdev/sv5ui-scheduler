export interface Span {
    readonly startColumn: number
    readonly endColumn: number
    readonly order?: number
}

export function assignLanes(spans: readonly Span[]): number[] {
    const order = spans
        .map((span, index) => ({ span, index }))
        .sort(
            (a, b) =>
                a.span.startColumn - b.span.startColumn ||
                b.span.endColumn - b.span.startColumn - (a.span.endColumn - a.span.startColumn) ||
                (a.span.order ?? 0) - (b.span.order ?? 0) ||
                a.index - b.index
        )

    const lanes: number[] = new Array(spans.length)
    const laneEnds: number[] = []
    for (const { span, index } of order) {
        let lane = laneEnds.findIndex((end) => end <= span.startColumn)
        if (lane === -1) lane = laneEnds.length
        laneEnds[lane] = span.endColumn
        lanes[index] = lane
    }
    return lanes
}
