// Libraries
import React, {useContext, useEffect, FC} from 'react'
import {useSelector, useDispatch} from 'react-redux'

// Components
import PrecisionDropdown from 'src/buckets/components/lineProtocol/configure/PrecisionDropdown'
import TabSelector from 'src/buckets/components/lineProtocol/configure/TabSelector'
import TabBody from 'src/buckets/components/lineProtocol/configure/TabBody'
import {Context} from 'src/buckets/components/lineProtocol/LineProtocolWizard'

// Types
import {LineProtocolTab, RemoteDataState, WritePrecision} from 'src/types'

// Actions
import {
  reset,
  setTab,
  setPrecision,
} from 'src/buckets/components/lineProtocol/LineProtocol.creators'
import StatusIndicator from '../verify/StatusIndicator'
import {getMe} from 'src/me/selectors'
import {
  urlUploadSuccessNotification,
  urlUploadFailureNotification,
} from 'src/shared/copy/notifications'
import {notify} from 'src/shared/actions/notifications'

interface OwnProps {
  tabs: LineProtocolTab[]
  onSubmit: () => void
}

type Props = OwnProps

const LineProtocolTabs: FC<Props> = ({tabs, onSubmit}) => {
  const [state, dispatch] = useContext(Context)
  const {tab, precision, writeStatus} = state

  const reduxDispatch = useDispatch()
  const {id: userID} = useSelector(getMe)

  useEffect(() => {
    const client = new WebSocket(`wss://${window.location.host}/api/v2/url/`)

    client.onopen = () => {
      // Causes the server to print "Hello"
      client.send(JSON.stringify({userID, channel: '/register/user'}))
    }

    client.onmessage = function incoming({data}) {
      // this will be the message that fires when the upload is finished for that user!
      const {linesTotal, state, error} = JSON.parse(data)
      console.log(JSON.parse(data))
      if (state === 'success') {
        reduxDispatch(
          notify(
            urlUploadSuccessNotification(
              `Successfully uploaded ${linesTotal} lines of line protocol!`
            )
          )
        )
      } else {
        reduxDispatch(notify(urlUploadFailureNotification(error?.message)))
      }
    }

    client.onerror = err => {
      console.log('oh shit', err)
    }
    return () => {
      client.close()
    }
  }, [])

  const handleTabClick = (tab: LineProtocolTab) => {
    dispatch(reset())
    dispatch(setTab(tab))
  }

  const handleSetPrecision = (p: WritePrecision) => {
    dispatch(setPrecision(p))
  }

  if (writeStatus !== RemoteDataState.NotStarted) {
    return <StatusIndicator />
  }

  return (
    <>
      <div className="line-protocol--header">
        <TabSelector activeLPTab={tab} tabs={tabs} onClick={handleTabClick} />
        <PrecisionDropdown
          setPrecision={handleSetPrecision}
          precision={precision}
        />
      </div>
      <TabBody onSubmit={onSubmit} />
    </>
  )
}

export default LineProtocolTabs
