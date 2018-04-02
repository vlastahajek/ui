import React, {PureComponent} from 'react'
import classnames from 'classnames'
import _ from 'lodash'

import MultiSelectDropdown from 'src/shared/components/MultiSelectDropdown'
import {USERS_TABLE} from 'src/admin/constants/tableSizing'
import {User} from 'src/types/influxAdmin'

interface Props {
  user: User
  allPermissions: string[]
  onUpdatePermissions: (user: User, permissions: any[]) => void
}

class UserPermissionsDropdown extends PureComponent<Props> {
  constructor(props) {
    super(props)
  }

  public render() {
    return (
      <MultiSelectDropdown
        buttonSize="btn-xs"
        buttonColor="btn-primary"
        resetStateOnReceiveProps={false}
        items={this.allPermissions}
        label={this.permissionsLabel}
        customClass={this.permissionsClass}
        selectedItems={this.selectedPermissions}
        onApply={this.handleUpdatePermissions}
      />
    )
  }

  private handleUpdatePermissions = (permissions): void => {
    const {onUpdatePermissions, user} = this.props
    const allowed = permissions.map(p => p.name)
    onUpdatePermissions(user, [{scope: 'all', allowed}])
  }

  private get allPermissions() {
    return this.props.allPermissions.map(p => ({name: p}))
  }

  private get userPermissions() {
    return _.get(this.props.user, ['permissions', '0', 'allowed'], [])
  }

  private get selectedPermissions() {
    return this.userPermissions.map(p => ({name: p}))
  }

  private get permissionsLabel() {
    const {user} = this.props
    return user.permissions && user.permissions.length
      ? ''
      : 'Select Permissions'
  }

  private get permissionsClass() {
    return classnames(`dropdown-${USERS_TABLE.colPermissions}`, {
      'admin-table--multi-select-empty': !this.props.user.permissions.length,
    })
  }
}

export default UserPermissionsDropdown
