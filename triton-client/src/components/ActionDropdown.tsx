import { ReactElement } from "react"
import type { MenuProps } from "antd"
import { Dropdown } from "antd"
import { StagingAction } from "./DatasetCard"

interface dropdownProps {
    button: ReactElement
    actions: StagingAction[]
}

export function ActionDropdown(props: dropdownProps): ReactElement {
    const { button, actions } = props
    const items: MenuProps["items"] = actions.map((a: StagingAction) => {
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
