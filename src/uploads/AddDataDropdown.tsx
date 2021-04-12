import React, {FC, memo} from 'react'
import {useSelector} from 'react-redux'
import {
  Dropdown,
  ComponentColor,
  ComponentSize,
  IconFont,
} from '@influxdata/clockface'
import {withRouter, RouteComponentProps} from 'react-router-dom'

// Selectors
import {getOrg} from 'src/organizations/selectors'

const AddDataDropdown: FC<RouteComponentProps> = ({history}) => {
  const {id: orgID} = useSelector(getOrg)

  const navigate = (uploadType: string) => {
    history.push(`/orgs/${orgID}/load-data/file-upload/${uploadType}`)
  }

  const optionItems = [
    <Dropdown.Item
      id="line protocol"
      key="line protocol"
      onClick={navigate}
      value="lp"
      testID="add-data-dropdown--lp"
    >
      Line Protocol
    </Dropdown.Item>,
    <Dropdown.Item
      id="csv uploader"
      key="csv uploader"
      onClick={navigate}
      value="csv"
      testID="add-data-dropdown--csv"
    >
      CSV Uploader
    </Dropdown.Item>,
  ]
  return (
    <Dropdown
      style={{width: '190px'}}
      testID="add-resource-dropdown"
      button={(active, onClick) => (
        <Dropdown.Button
          testID="add-resource-dropdown--button"
          active={active}
          onClick={onClick}
          color={ComponentColor.Primary}
          size={ComponentSize.Small}
          icon={IconFont.Plus}
        >
          Upload Data
        </Dropdown.Button>
      )}
      menu={onCollapse => (
        <Dropdown.Menu
          onCollapse={onCollapse}
          testID="add-resource-dropdown--menu"
        >
          {optionItems}
        </Dropdown.Menu>
      )}
    >
      <>{optionItems}</>
    </Dropdown>
  )
}

export default memo(withRouter(AddDataDropdown))
