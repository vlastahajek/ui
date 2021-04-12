// Libraries
import React, {FC} from 'react'
import {useHistory, useParams} from 'react-router-dom'

// Components
import {Overlay, OverlayFooter} from '@influxdata/clockface'
import LineProtocol from 'src/buckets/components/lineProtocol/configure/LineProtocol'

// Types
import LineProtocolFooterButtons from './LineProtocolFooterButtons'

<<<<<<< HEAD
// Selectors
import {getOrg} from 'src/organizations/selectors'

interface LineProtocolContextWithParams extends LineProtocolState {
  org: string
  bucket: string
}

type LineProtocolContext = [LineProtocolContextWithParams, Dispatch<Action>]
export const Context = React.createContext<LineProtocolContext>(null)

const getState = (bucketID: string) => (state: AppState) => {
  const bucket = getByID<Bucket>(state, ResourceType.Buckets, bucketID)
  const org = getOrg(state).name
  return {bucket: bucket?.name || '', org}
}

const LineProtocolWizard = () => {
=======
const LineProtocolWizard: FC = () => {
>>>>>>> master
  const history = useHistory()
  const {orgID} = useParams<{orgID: string}>()

  const handleDismiss = () => {
    history.push(`/orgs/${orgID}/load-data/buckets`)
  }

  return (
<<<<<<< HEAD
    <Context.Provider value={[{...state, org, bucket}, dispatch]}>
      <Overlay visible={true}>
        <Overlay.Container maxWidth={800}>
          <Overlay.Header
            title="Add Data Using Line Protocol"
            onDismiss={handleDismiss}
          />
          <LineProtocol onSubmit={handleSubmit} />
          <OverlayFooter>
            <LineProtocolFooterButtons onSubmit={handleSubmit} />
          </OverlayFooter>
        </Overlay.Container>
      </Overlay>
    </Context.Provider>
=======
    <Overlay visible={true}>
      <Overlay.Container maxWidth={800}>
        <Overlay.Header
          title="Add Data Using Line Protocol"
          onDismiss={handleDismiss}
        />
        <LineProtocol />
        <OverlayFooter>
          <LineProtocolFooterButtons />
        </OverlayFooter>
      </Overlay.Container>
    </Overlay>
>>>>>>> master
  )
}

export default LineProtocolWizard
