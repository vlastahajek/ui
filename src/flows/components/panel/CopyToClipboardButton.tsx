// Libraries
import React, {FC} from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'

// Components
import {SquareButton, IconFont} from '@influxdata/clockface'

// Utils
import {
  copyToClipboardFailed,
  copyToClipboardSuccess,
} from 'src/shared/copy/notifications'
import {notify} from 'src/shared/actions/notifications'

interface Props {
  fid: string
}

const CopyToClipboardButton: FC<Props> = ({fid}) => {
  const handleCopyAttempt = (
    copiedText: string,
    isSuccessful: boolean
  ): void => {
    const text = copiedText.slice(0, 30).trimRight()
    const truncatedText = `${text}...`

    if (isSuccessful) {
      notify(copyToClipboardSuccess(truncatedText, 'Bucket ID'))
    } else {
      notify(copyToClipboardFailed(truncatedText, 'Bucket ID'))
    }
  }

  return (
    <CopyToClipboard text={fid} onCopy={handleCopyAttempt}>
      <span className="copy-bucket-id" title="Click to Copy to Clipboard">
        <SquareButton
          className="flows-copycb-cell"
          testID="flows-copycb-cell"
          icon={IconFont.Duplicate}
          titleText="Copy to Clipboard"
        />
      </span>
    </CopyToClipboard>
  )
}

export default CopyToClipboardButton
