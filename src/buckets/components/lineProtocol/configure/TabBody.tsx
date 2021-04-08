// Libraries
import React, {FC, ChangeEvent, useContext, memo} from 'react'
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
import {Context} from 'src/buckets/components/lineProtocol/LineProtocolWizard'

// Action
import {
  setBody,
  reset,
} from 'src/buckets/components/lineProtocol/LineProtocol.creators'
import {getMe} from 'src/me/selectors'

import {
  retrieveLineProtocolFromUrl,
  writeLineProtocolStream,
} from 'src/buckets/components/lineProtocol/LineProtocol.thunks'

import {RemoteDataState} from 'src/types'

interface Props {
  onSubmit: () => void
}

const TabBody: FC<Props> = ({onSubmit}) => {
  const {id: userID} = useSelector(getMe)

  const [
    {body, uploadStatus, tab, precision, org, bucket, preview},
    dispatch,
  ] = useContext(Context)
  const handleTextChange = (
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    dispatch(setBody(e.target.value))
  }

  const handleSubmit = () => {
    try {
      retrieveLineProtocolFromUrl(dispatch, {
        url: body,
        userID,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleSetBody = (b: string) => {
    dispatch(setBody(b))
  }

  const handleReset = () => {
    dispatch(reset())
  }

  const handleSubmitStream = () => {
    try {
      writeLineProtocolStream(
        dispatch,
        {
          url: body,
          userID,
        },
        {
          precision,
          org,
          bucket,
        }
      )
    } catch (err) {
      console.error(err)
    }
  }

  const UploadButton = ({status}) => (
    <Button
      text="Upload"
      color={ComponentColor.Primary}
      onClick={handleSubmit}
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
      onClick={handleReset}
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
          onSubmit={onSubmit}
          onSetBody={handleSetBody}
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
