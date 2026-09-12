export interface Interval {
    readonly startMs: number
    readonly endMs: number
}

export interface ColumnPlacement {
    readonly column: number
    readonly columns: number
}

export function assignColumns(intervals: readonly Interval[]): ColumnPlacement[] {
    const order = intervals
        .map((interval, index) => ({ interval, index }))
        .sort(
            (a, b) =>
                a.interval.startMs - b.interval.startMs ||
                b.interval.endMs - b.interval.startMs - (a.interval.endMs - a.interval.startMs) ||
                a.index - b.index
        )

    const placements: ColumnPlacement[] = new Array(intervals.length)
    let cluster: { index: number; column: number }[] = []
    let columnEnds: number[] = []
    let clusterEnd = -Infinity

    const closeCluster = () => {
        for (const member of cluster) {
            placements[member.index] = { column: member.column, columns: columnEnds.length }
        }
        cluster = []
        columnEnds = []
    }

    for (const { interval, index } of order) {
        if (interval.startMs >= clusterEnd) closeCluster()
        const column = firstFreeColumn(columnEnds, interval.startMs)
        columnEnds[column] = interval.endMs
        cluster.push({ index, column })
        clusterEnd = Math.max(clusterEnd, interval.endMs)
    }
    closeCluster()

    return placements
}

function firstFreeColumn(columnEnds: number[], startMs: number): number {
    const free = columnEnds.findIndex((end) => end <= startMs)
    return free === -1 ? columnEnds.length : free
}
