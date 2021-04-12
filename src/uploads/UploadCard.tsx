import React, {FC} from 'react'

import UploadStatus from 'src/uploads/UploadStatus'

import {
  ResourceCard,
  FlexBox,
  AlignItems,
  FlexDirection,
  ComponentSize,
} from '@influxdata/clockface'

interface OwnProps {
  upload: any
}
const UploadCard: FC<OwnProps> = ({upload}) => {
  return (
    <ResourceCard
      testID="upload-card"
      alignItems={AlignItems.Center}
      margin={ComponentSize.Large}
      direction={FlexDirection.Row}
    >
      <UploadStatus status={upload.state} />
      <FlexBox
        alignItems={AlignItems.FlexStart}
        direction={FlexDirection.Column}
        margin={ComponentSize.Medium}
      >
        <ResourceCard.Name
          name={upload.url ?? 'default'}
          testID="upload-card--name"
        />
        <ResourceCard.Meta>
          <>Upload started: {upload.uploadStarted}</>
          <>Upload finished: {upload.uploadFinished}</>
          <>Upload ID: {upload.uploadID}</>
          <>Uploaded by user: {upload.userID}</>
        </ResourceCard.Meta>
      </FlexBox>
    </ResourceCard>
  )
}

export default UploadCard
