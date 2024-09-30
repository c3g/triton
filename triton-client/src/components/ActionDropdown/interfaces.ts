import { ReactElement } from "react"

export interface ActionDropdownProps {
    button: ReactElement
    actions: {
        action: { name: string; actionCall: () => Promise<void> }
        icon: ReactElement
    }[]
}
