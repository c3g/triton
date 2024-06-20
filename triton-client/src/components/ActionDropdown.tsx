import { ReactElement } from "react"
import type { MenuProps } from "antd"
import { Dropdown } from "antd"

export interface ActionDropdownProps {
    button: ReactElement
    actions: {
        action: { name: string; actionCall: () => void }
        icon: ReactElement
    }[]
}

export function ActionDropdown(props: ActionDropdownProps): ReactElement {
    const { button, actions } = props
    const items: MenuProps["items"] = actions.map((a) => {
        return {
            key: a.action.name,
            label: a.action.name,
            icon: a.icon,
            onClick: a.action.actionCall,
        }
    })

    return (
        <Dropdown
            menu={{ items }}
            placement="bottom"
            arrow={{ pointAtCenter: true }}
        >
            {button}
        </Dropdown>
    )
}
