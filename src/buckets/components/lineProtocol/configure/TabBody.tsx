// Libraries
import React, {FC, ChangeEvent, useContext} from 'react'
import axios from 'axios'

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
import {setBody} from 'src/buckets/components/lineProtocol/LineProtocol.creators'

interface Props {
  onSubmit: (customBody: string | null) => void
}

const TabBody: FC<Props> = ({onSubmit}) => {
  const [{body, tab}, dispatch] = useContext(Context)

  const handleTextChange = (
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    dispatch(setBody(e.target.value))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const response = await axios.get(`http://localhost:3000/url`, {
        params: {url: body},
      })
      onSubmit(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSetBody = (b: string) => {
    dispatch(setBody(b))
  }

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
            <Input
              type={InputType.Text}
              size={ComponentSize.Medium}
              value={body}
              onChange={handleTextChange}
            />
            <Button
              text="Upload"
              color={ComponentColor.Primary}
              onClick={handleSubmit}
              status={
                body.length ? ComponentStatus.Default : ComponentStatus.Disabled
              }
              className="line-protocol--url-upload-button"
              size={ComponentSize.Medium}
            />
          </Grid>
        </>
      )
  }
}

export default TabBody
