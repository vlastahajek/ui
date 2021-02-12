// Libraries
import React, {FC} from 'react'

// Components
import {Form, Overlay} from '@influxdata/clockface'
import LineProtocolTabs from 'src/buckets/components/lineProtocol/configure/LineProtocolTabs'
import LineProtocolHelperText from 'src/buckets/components/lineProtocol/LineProtocolHelperText'

// Types
import {LineProtocolTab} from 'src/types/index'

import {isFlagEnabled} from 'src/shared/utils/featureFlag'

type OwnProps = {onSubmit: () => void}
type Props = OwnProps

const tabs: Partial<LineProtocolTab>[] = [
  'Upload File',
  'Enter Manually',
  'Upload From URL',
]

const baseTabs: Partial<LineProtocolTab>[] = ['Upload File', 'Enter Manually']

const LineProtocol: FC<Props> = ({onSubmit}) => {
  return (
    <Form>
      <Overlay.Body style={{textAlign: 'center'}}>
        <LineProtocolTabs
          tabs={isFlagEnabled('lineProtocolURL') ? tabs : baseTabs}
          onSubmit={onSubmit}
        />
        <LineProtocolHelperText />
      </Overlay.Body>
    </Form>
  )
}

export default LineProtocol
