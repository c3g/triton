import { ReactElement } from "react"
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'

export interface StagingAction {
  action: { name: string, actionCall: () => void }
  icon: ReactElement
}

export interface ActionDropdownProps {
  button: ReactElement
  actions: StagingAction[]
  disabled?: boolean
}

export function ActionDropdown({ button, actions, disabled }: ActionDropdownProps) : ReactElement {
  const items: MenuProps['items'] = actions.map((a: StagingAction) => {
          return {  key: a.action.name,
                    label: a.action.name,
                    icon: a.icon,
                    onClick: a.action.actionCall
                 }
  })

  return (
    <Dropdown menu={{items}} placement="bottom" arrow={{ pointAtCenter: true }} disabled={disabled}>
      {button}
    </Dropdown>)
}