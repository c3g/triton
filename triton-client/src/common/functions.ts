export function isNullish<T>(
    value: NonNullable<T> | undefined | null,
): value is undefined | null {
    return value === undefined || value === null
}

export function unitWithMagnitude(size: number) {
    const BYTE = { unit: "Byte", magnitude: 1 } as const
    const KB = { unit: "KB", magnitude: 1000 } as const
    const MB = { unit: "MB", magnitude: 1000000 } as const
    const GB = { unit: "GB", magnitude: 1000000000 } as const
    const TB = { unit: "TB", magnitude: 1000000000000 } as const
    const PB = { unit: "PB", magnitude: 1000000000000000 } as const

    for (const b of [PB, TB, GB, MB, KB]) {
        if (size >= b.magnitude) {
            return b
        }
    }

    return BYTE
}

export function dataSize(size: number) {
    const { unit, magnitude } = unitWithMagnitude(size)
    return [(size / magnitude).toFixed(2), unit] as const
}
