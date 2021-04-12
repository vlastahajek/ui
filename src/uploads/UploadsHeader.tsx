import React, {FC, memo} from 'react'

import {
  Page,
  FlexBox,
  FlexDirection,
  ComponentSize,
} from '@influxdata/clockface'
import SearchWidget from 'src/shared/components/search_widget/SearchWidget'
import AddDataDropdown from 'src/uploads/AddDataDropdown'

interface OwnProps {
  term: string
  setTerm: (term: string) => void
}
const UploadsHeader: FC<OwnProps> = ({term, setTerm}) => {
  return (
    <>
      <Page.Header fullWidth={false} testID="uploads-page--header">
        <Page.Title title="Uploads" />
      </Page.Header>
      <Page.ControlBar fullWidth={false}>
        <Page.ControlBarLeft>
          <SearchWidget
            placeholderText="Filter uploads..."
            onSearch={setTerm}
            searchTerm={term}
          />
        </Page.ControlBarLeft>
        <Page.ControlBarRight>
          <FlexBox direction={FlexDirection.Row} margin={ComponentSize.Medium}>
            <AddDataDropdown />
          </FlexBox>
        </Page.ControlBarRight>
      </Page.ControlBar>
    </>
  )
}

export default memo(UploadsHeader)
