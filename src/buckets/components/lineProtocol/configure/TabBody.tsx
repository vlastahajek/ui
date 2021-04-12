// Libraries
import React, {FC, useContext, memo} from 'react'
import {useParams} from 'react-router-dom'
import {useSelector} from 'react-redux'

// Components
import {
  ComponentSize,
  Input,
  InputLabel,
  InputType,
  TextArea,
  ComponentColor,
  Button,
  ComponentStatus,
  Grid,
} from '@influxdata/clockface'
import DragAndDrop from 'src/buckets/components/lineProtocol/configure/DragAndDrop'
import {LineProtocolContext} from 'src/buckets/components/context/lineProtocol'

// Utils
import {getByID} from 'src/resources/selectors'

// Types
import {AppState, Bucket, ResourceType, RemoteDataState} from 'src/types'

type Props = {
  bucket?: string
}

const TabBody: FC<Props> = ({bucket}) => {
  const {
    uploadStatus,
    preview,
    body,
    handleSetBody,
    tab,
    writeLineProtocol,
    retrieveLineProtocolFromUrl,
    writeLineProtocolStream,
    handleResetLineProtocol,
  } = useContext(LineProtocolContext)
  const {bucketID} = useParams<{bucketID?: string}>()

  const selectedBucket =
    useSelector((state: AppState) =>
      getByID<Bucket>(state, ResourceType.Buckets, bucketID)
    )?.name ?? ''

  const onSetBody = (b: string) => {
    handleSetBody(b)
  }

  const handleTextChange = e => {
    onSetBody(e.target.value)
  }

  const handleSubmit = () => {
    writeLineProtocol(bucket ?? selectedBucket)
  }

  const handleSubmitStream = () => {
    try {
      writeLineProtocolStream(body, bucket)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmitURL = () => {
    try {
      retrieveLineProtocolFromUrl(body)
    } catch (err) {
      console.error(err)
    }
  }

  const UploadButton = ({status}) => (
    <Button
      text="Upload"
      color={ComponentColor.Primary}
      onClick={handleSubmitURL}
      status={status}
      className="line-protocol--url-upload-button"
      size={ComponentSize.Medium}
    />
  )

  const SubmitButton = () => (
    <Button
      text="Submit"
      color={ComponentColor.Success}
      onClick={handleSubmitStream}
      status={body.length ? ComponentStatus.Default : ComponentStatus.Disabled}
      className="line-protocol--url-upload-button"
      size={ComponentSize.Medium}
    />
  )

  const ResetButton = () => (
    <Button
      text="Reset"
      color={ComponentColor.Danger}
      onClick={handleResetLineProtocol}
      status={ComponentStatus.Default}
      className="line-protocol--url-upload-button"
      style={{marginLeft: '5px'}}
      size={ComponentSize.Medium}
    />
  )

  switch (tab) {
    case 'Upload File':
      return (
        <DragAndDrop
          className="line-protocol--content"
          onSubmit={handleSubmit}
          onSetBody={onSetBody}
        />
      )
    case 'Enter Manually':
      return (
        <TextArea
          value={body}
          placeholder="Write text here"
          onChange={handleTextChange}
          testID="line-protocol--text-area"
          className="line-protocol--content"
        />
      )
    case 'Upload From URL':
      return (
        <>
          <InputLabel active={false} className="line-protocol--enter-url">
            Enter URL
          </InputLabel>
          <Grid className="line-protocol--url-grid">
            {uploadStatus === RemoteDataState.Done ? (
              <Grid>
                <TextArea
                  value={preview}
                  placeholder="Write text here"
                  onChange={handleTextChange}
                  testID="line-protocol--text-area"
                  className="line-protocol--content"
                />
                <Grid className="line-protocol--buttongrid">
                  <SubmitButton />
                  <ResetButton />
                </Grid>
              </Grid>
            ) : uploadStatus === RemoteDataState.Loading ? (
              <>
                <Input
                  type={InputType.Text}
                  size={ComponentSize.Medium}
                  value={body}
                  onChange={handleTextChange}
                  status={ComponentStatus.Disabled}
                />
                <UploadButton status={ComponentStatus.Loading} />
              </>
            ) : (
              <>
                <Input
                  type={InputType.Text}
                  size={ComponentSize.Medium}
                  value={body}
                  onChange={handleTextChange}
                />
                <UploadButton
                  status={
                    body.length
                      ? ComponentStatus.Default
                      : ComponentStatus.Disabled
                  }
                />
              </>
            )}
          </Grid>
        </>
      )
  }
}

export default memo(TabBody)
