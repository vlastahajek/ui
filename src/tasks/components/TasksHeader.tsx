// Libraries
import React, {PureComponent} from 'react'

// Components
import {
  InputLabel,
  SlideToggle,
  ComponentSize,
  Page,
  Sort,
  FlexBox,
  FlexDirection,
} from '@influxdata/clockface'
import AddResourceDropdown from 'src/shared/components/AddResourceDropdown'
import SearchWidget from 'src/shared/components/search_widget/SearchWidget'
import ResourceSortDropdown from 'src/shared/components/resource_sort_dropdown/ResourceSortDropdown'
import RateLimitAlert from 'src/cloud/components/RateLimitAlert'

// Utils
import {event} from 'src/cloud/utils/reporting'

// Types
import {LimitStatus} from 'src/cloud/actions/limits'
import {setSearchTerm as setSearchTermAction} from 'src/tasks/actions/creators'
import {TaskSortKey} from 'src/shared/components/resource_sort_dropdown/generateSortItems'
import {SortTypes} from 'src/shared/utils/sort'
import {ResourceType} from 'src/types'

interface Props {
  onCreateTask: () => void
  setShowInactive: () => void
  showInactive: boolean
  onImportTask: () => void
  limitStatus: LimitStatus['status']
  searchTerm: string
  setSearchTerm: typeof setSearchTermAction
  sortKey: TaskSortKey
  sortDirection: Sort
  sortType: SortTypes
  onSort: (
    sortKey: TaskSortKey,
    sortDirection: Sort,
    sortType: SortTypes
  ) => void
}

export default class TasksHeader extends PureComponent<Props> {
  public render() {
    const {
      onCreateTask,
      setShowInactive,
      showInactive,
      onImportTask,
      setSearchTerm,
      searchTerm,
      sortKey,
      sortType,
      sortDirection,
      onSort,
      limitStatus,
    } = this.props

    const creater = () => {
      event('Task Created From Dropdown', {source: 'header'})
      onCreateTask()
    }
    const importer = () => {
      event('Task Imported From Dropdown', {source: 'header'})
      onImportTask()
    }

    return (
      <>
        <Page.Header fullWidth={false} testID="tasks-page--header">
          <Page.Title title="Tasks" />
          <RateLimitAlert />
        </Page.Header>
        <Page.ControlBar fullWidth={false}>
          <Page.ControlBarLeft>
            <SearchWidget
              placeholderText="Filter tasks..."
              onSearch={setSearchTerm}
              searchTerm={searchTerm}
            />
            <ResourceSortDropdown
              resourceType={ResourceType.Tasks}
              sortKey={sortKey}
              sortType={sortType}
              sortDirection={sortDirection}
              onSelect={onSort}
            />
          </Page.ControlBarLeft>
          <Page.ControlBarRight>
            <FlexBox
              direction={FlexDirection.Row}
              margin={ComponentSize.Medium}
            >
              <InputLabel>Show Inactive</InputLabel>
              <SlideToggle
                active={showInactive}
                size={ComponentSize.ExtraSmall}
                onChange={setShowInactive}
              />
            </FlexBox>
            <AddResourceDropdown
              onSelectNew={creater}
              onSelectImport={importer}
              resourceName="Task"
              limitStatus={limitStatus}
            />
          </Page.ControlBarRight>
        </Page.ControlBar>
      </>
    )
  }
}
