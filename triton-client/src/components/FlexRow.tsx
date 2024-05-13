import React, { PropsWithChildren } from 'react'

/**
 * Creates a flexbox row that lays out its children so that the first
 * child is on the left, the last child is on the right, and the children
 * are evenly spaced.
 * @param
 * @returns
 */
export default function FlexRow({ children }: PropsWithChildren) {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'space-between',
			}}
		>
			{children}
		</div>
	)
}
