// Libraries
import React, {FC, useRef, useState} from 'react'
import classnames from 'classnames'

// Components
import {
  Icon,
  IconFont,
  Popover,
  Appearance,
  PopoverInteraction,
  ComponentColor,
  TechnoSpinner,
} from '@influxdata/clockface'

// Styles
import './UploadStatus.scss'

interface PassedProps {
  status: string
}

const UploadStatus: FC<PassedProps> = ({status}) => {
  const triggerRef = useRef<HTMLDivElement>(null)
  const [highlight, setHighlight] = useState<boolean>(false)

  let color = ComponentColor.Success
  let icon = IconFont.Checkmark
  let text = 'Upload finished successfully!'

  if (status === 'error') {
    color = ComponentColor.Danger
    icon = IconFont.AlertTriangle
    text = 'Upload Failed'
  }

  const statusClassName = classnames('upload', {
    [`upload-status__${color}`]: color,
    [`upload-status__${highlight}`]: highlight,
  })

  const popoverContents = () => (
    <>
      <h6>Upload Status:</h6>
      <p>{text}</p>
    </>
  )

  return (
    <>
      <div
        data-testid="upload-status--icon"
        className={statusClassName}
        ref={triggerRef}
      >
        {status === 'loading' ? (
          <TechnoSpinner diameterPixels={30} />
        ) : (
          <Icon glyph={icon} />
        )}
      </div>
      <Popover
        className="upload--popover"
        enableDefaultStyles={false}
        color={color}
        appearance={Appearance.Outline}
        triggerRef={triggerRef}
        contents={popoverContents}
        showEvent={PopoverInteraction.Hover}
        hideEvent={PopoverInteraction.Hover}
        onShow={() => setHighlight(true)}
        onHide={() => setHighlight(false)}
      />
    </>
  )
}

export default UploadStatus
