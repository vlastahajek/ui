import React, {FC} from 'react'

import UploadStatus from 'src/uploads/UploadStatus'

import {
  ResourceCard,
  FlexBox,
  AlignItems,
  FlexDirection,
  ComponentSize,
  IconFont,
  ComponentColor,
} from '@influxdata/clockface'

import {Context} from 'src/clockface'

interface OwnProps {
  upload: any
  untrack: (_: string) => void
}
import './Uploads.scss'

const ContextMenu: FC<OwnProps> = ({upload, untrack}) => {
  const onDelete = async (u: any) => {
    await untrack(u.uploadID)
  }
  return (
    <Context>
      <Context.Menu
        icon={IconFont.Trash}
        color={ComponentColor.Danger}
        testID="context-delete-menu"
      >
        <Context.Item
          label="Delete"
          action={onDelete}
          value={upload}
          testID="context-delete-task"
        />
      </Context.Menu>
    </Context>
  )
}
const UploadCard: FC<OwnProps> = ({upload, untrack}) => {
  return (
    <ResourceCard
      testID="upload-card"
      alignItems={AlignItems.Center}
      margin={ComponentSize.Large}
      direction={FlexDirection.Row}
      contextMenu={<ContextMenu upload={upload} untrack={untrack} />}
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
          style={{
            maxWidth: '340px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        />
        <ResourceCard.Meta>
          <>Bucket: {upload.bucket}</>
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
