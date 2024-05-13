/**
 * Defines a type where an key is mapped to an item.
 */
export type ItemID = number | string

export interface ItemsById<T> {
	[key: ItemID]: T
}

export interface ItemWithId {
	id: ItemID
}

export function createItemsById<T>(items: T[], idFunc: (item: T) => ItemID): ItemsById<T> {
	const itemsById: ItemsById<T> = {}
	items.reduce((acc, item) => {
		const key = idFunc(item)
		acc[key] = item
		return acc
	}, itemsById)
	return itemsById
}

/**
 * Defines a type where a key is mapped to an array of items.
 */
export interface ItemsByIdArray<T> {
	[key: ItemID]: T[]
}

/**
 * Takes an array of items and returns an ItemsByIdArray object, where the items
 * are grouped into lists using a property of the items as keys.
 * Eg. grouping datasets by project id.
 * @param items
 * @param idFunc
 * @returns
 */
export function createItemsByIdArray<T extends ItemWithId>(items: T[], idFunc: (item: T) => ItemID): ItemsByIdArray<T> {
	const itemsByIdArray: ItemsByIdArray<T> = {}
	items.reduce((acc, item) => {
		const key = idFunc(item)
		if (!acc[key]) {
			acc[key] = []
		}
		acc[key].push(item)
		return acc
	}, itemsByIdArray)
	return itemsByIdArray
}
