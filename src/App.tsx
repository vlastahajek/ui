// Libraries
import React, {FC, Suspense, lazy, useContext, useEffect} from 'react'
import {useSelector} from 'react-redux'
import classnames from 'classnames'
import {Switch, Route} from 'react-router-dom'
import {setAutoFreeze} from 'immer'
import {AppSettingContext, AppSettingProvider} from 'src/shared/contexts/app'

import {
  RUDDERSTACK_DATA_PLANE_URL,
  RUDDERSTACK_WRITE_KEY,
} from 'src/shared/constants'
import {load} from 'rudder-sdk-js'
import {reportErrorThroughHoneyBadger} from 'src/shared/utils/errors'

// Components
import {AppWrapper} from '@influxdata/clockface'
import TreeNav from 'src/pageLayout/containers/TreeNav'
import TooltipPortal from 'src/portals/TooltipPortal'
import NotesPortal from 'src/portals/NotesPortal'
import Notifications from 'src/shared/components/notifications/Notifications'
import GlobalSearch from 'src/shared/search/GlobalSearch'
import {
  OverlayProviderComp,
  OverlayController,
} from 'src/overlays/components/OverlayController'
import PageSpinner from 'src/perf/components/PageSpinner'
import EngagementLink from './cloud/components/onboarding/EngagementLink'
const SetOrg = lazy(() => import('src/shared/containers/SetOrg'))
const CreateOrgOverlay = lazy(() =>
  import('src/organizations/components/CreateOrgOverlay')
)

// Types
import {AppState} from 'src/types'

// Utils
import {isFlagEnabled} from 'src/shared/utils/featureFlag'
import {CLOUD} from 'src/shared/constants'

const App: FC = () => {
  const {theme, presentationMode} = useContext(AppSettingContext)
  const currentPage = useSelector((state: AppState) => state.currentPage)

  const appWrapperClass = classnames('', {
    'dashboard-light-mode': currentPage === 'dashboard' && theme === 'light',
  })

  useEffect(() => {
    if (CLOUD && isFlagEnabled('rudderstackReporting')) {
      try {
        load(RUDDERSTACK_WRITE_KEY, RUDDERSTACK_DATA_PLANE_URL)
      } catch (error) {
        console.error(
          'Error loading Rudderstack with wk: ',
          RUDDERSTACK_WRITE_KEY,
          ' at: ',
          RUDDERSTACK_DATA_PLANE_URL
        )
        reportErrorThroughHoneyBadger(error, {
          name: 'Rudderstack Loading Function',
        })
      }
    }
    setAutoFreeze(false)
  }, [])

  return (
    <AppWrapper presentationMode={presentationMode} className={appWrapperClass}>
      {isFlagEnabled('globalSearch') && <GlobalSearch />}
      <Notifications />
      <TooltipPortal />
      <NotesPortal />
      <OverlayProviderComp>
        <OverlayController />
      </OverlayProviderComp>
      <EngagementLink />
      <TreeNav />
      <Suspense fallback={<PageSpinner />}>
        <Switch>
          <Route path="/orgs/new" component={CreateOrgOverlay} />
          <Route path="/orgs/:orgID" component={SetOrg} />
        </Switch>
      </Suspense>
    </AppWrapper>
  )
}

export default () => (
  <AppSettingProvider>
    <App />
  </AppSettingProvider>
)
