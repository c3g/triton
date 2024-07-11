import { ReactElement } from "react"
import type { MenuProps } from "antd"
import { Dropdown } from "antd"
import { ActionDropdownProps } from "./interfaces"

export default function ActionDropdown({
    button,
    actions,
}: ActionDropdownProps): ReactElement {
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
