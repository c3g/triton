export function isNullish<T>(value: NonNullable<T> | undefined | null): value is undefined | null {
	return value === undefined || value === null
}

export function sizeUnitWithScalar(size: number) {
	const BYTE = { unit: 'Byte', size: 1 } as const
	const KB = { unit: 'KB', size: 1000 } as const
	const MB = { unit: 'MB', size: 1000000 } as const
	const GB = { unit: 'GB', size: 1000000000 } as const
	const TB = { unit: 'TB', size: 1000000000000 } as const
	const PB = { unit: 'PB', size: 1000000000000000 } as const

	for (const b of [PB, TB, GB, MB, KB]) {
		if (size >= b.size) {
			return b
		}
	}

	return BYTE
}
