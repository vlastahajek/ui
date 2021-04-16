// Libraries
import React, {FC, useEffect, useCallback} from 'react'
import {connect, ConnectedProps, useDispatch} from 'react-redux'
import {withRouter, RouteComponentProps} from 'react-router-dom'

// Components
import AutoRefreshDropdown from 'src/shared/components/dropdown_auto_refresh/AutoRefreshDropdown'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import PresentationModeToggle from 'src/shared/components/PresentationModeToggle'
import DashboardLightModeToggle from 'src/dashboards/components/DashboardLightModeToggle'
import GraphTips from 'src/shared/components/graph_tips/GraphTips'
import RenamablePageTitle from 'src/pageLayout/components/RenamablePageTitle'
import TimeZoneDropdown from 'src/shared/components/TimeZoneDropdown'
import {Button, IconFont, ComponentColor, Page} from '@influxdata/clockface'
import {AnnotationsControlBarToggleButton} from 'src/annotations/components/AnnotationsControlBarToggleButton'
import {FeatureFlag} from 'src/shared/utils/featureFlag'

// Actions
import {toggleShowVariablesControls as toggleShowVariablesControlsAction} from 'src/userSettings/actions'
import {updateDashboard as updateDashboardAction} from 'src/dashboards/actions/thunks'
import {
  setAutoRefreshInterval as setAutoRefreshIntervalAction,
  setAutoRefreshStatus as setAutoRefreshStatusAction,
  resetDashboardAutoRefresh as resetDashboardAutoRefreshAction,
} from 'src/shared/actions/autoRefresh'
import {
  setDashboardTimeRange as setDashboardTimeRangeAction,
  updateQueryParams as updateQueryParamsAction,
} from 'src/dashboards/actions/ranges'

// Utils
import {event} from 'src/cloud/utils/reporting'
import {resetQueryCache} from 'src/shared/apis/queryCache'
import {isFlagEnabled} from 'src/shared/utils/featureFlag'

// Selectors
import {getTimeRange} from 'src/dashboards/selectors'
import {getByID} from 'src/resources/selectors'
import {getOrg} from 'src/organizations/selectors'

// Constants
import {DemoDataDashboardNames} from 'src/cloud/constants'
import {
  DEFAULT_DASHBOARD_NAME,
  DASHBOARD_NAME_MAX_LENGTH,
} from 'src/dashboards/constants/index'

// Types
import {
  AppState,
  AutoRefresh,
  AutoRefreshStatus,
  Dashboard,
  ResourceType,
  TimeRange,
} from 'src/types'

interface OwnProps {
  autoRefresh: AutoRefresh
  onManualRefresh: () => void
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps & RouteComponentProps<{orgID: string}>

const DashboardHeader: FC<Props> = ({
  dashboard,
  onManualRefresh,
  toggleShowVariablesControls,
  showVariablesControls,
  onSetAutoRefreshStatus,
  setAutoRefreshInterval,
  timeRange,
  updateDashboard,
  updateQueryParams,
  setDashboardTimeRange,
  history,
  org,
  autoRefresh,
}) => {
  const dispatch = useDispatch()
  const demoDataset = DemoDataDashboardNames[dashboard.name]
  useEffect(() => {
    if (demoDataset) {
      event('demoData_dashboardViewed', {demo_dataset: demoDataset})
    }
  }, [dashboard.id, demoDataset])

  const handleAddNote = () => {
    history.push(`/orgs/${org.id}/dashboards/${dashboard.id}/notes/new`)
  }

  const handleAddCell = () => {
    history.push(`/orgs/${org.id}/dashboards/${dashboard.id}/cells/new`)
  }

  const handleRenameDashboard = (name: string) => {
    updateDashboard(dashboard.id, {name})
  }

  const handleChooseAutoRefresh = (milliseconds: number) => {
    setAutoRefreshInterval(dashboard.id, milliseconds)

    if (milliseconds === 0) {
      onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Paused)
      return
    }

    onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Active)
  }

  const handleChooseTimeRange = (timeRange: TimeRange) => {
    resetQueryCache()
    setDashboardTimeRange(dashboard.id, timeRange)
    updateQueryParams({
      lower: timeRange.lower,
      upper: timeRange.upper,
    })

    if (timeRange.type === 'custom') {
      onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Disabled)
      return
    }

    if (autoRefresh.status === AutoRefreshStatus.Disabled) {
      if (autoRefresh.interval === 0) {
        onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Paused)
        return
      }

      onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Active)
    }
  }

  const resetCacheAndRefresh = useCallback((): void => {
    // We want to invalidate the existing cache when a user manually refreshes the dashboard
    resetQueryCache()
    onManualRefresh()
  }, [])

  const openAutoRefreshModal = () => {
    history.push(`/orgs/${org.id}/dashboards/${dashboard.id}/autorefresh`)
  }

  const stopAutoRefreshAndReset = () => {
    dispatch(resetDashboardAutoRefreshAction(dashboard.id))
  }

  return (
    <>
      <Page.Header fullWidth={true}>
        <RenamablePageTitle
          maxLength={DASHBOARD_NAME_MAX_LENGTH}
          onRename={handleRenameDashboard}
          name={dashboard && dashboard.name}
          placeholder={DEFAULT_DASHBOARD_NAME}
        />
      </Page.Header>
      <Page.ControlBar fullWidth={true}>
        <Page.ControlBarLeft>
          <Button
            icon={IconFont.AddCell}
            color={ComponentColor.Primary}
            onClick={handleAddCell}
            text="Add Cell"
            titleText="Add cell to dashboard"
          />
          <Button
            icon={IconFont.TextBlock}
            text="Add Note"
            onClick={handleAddNote}
            testID="add-note--button"
          />
          <Button
            icon={IconFont.Cube}
            text="Variables"
            testID="variables--button"
            onClick={toggleShowVariablesControls}
            color={
              showVariablesControls
                ? ComponentColor.Secondary
                : ComponentColor.Default
            }
          />
          <FeatureFlag name="annotations">
            <AnnotationsControlBarToggleButton />
          </FeatureFlag>
          <DashboardLightModeToggle />
          <PresentationModeToggle />
          <GraphTips />
        </Page.ControlBarLeft>
        <Page.ControlBarRight>
          <TimeZoneDropdown />
          <TimeRangeDropdown
            onSetTimeRange={handleChooseTimeRange}
            timeRange={timeRange}
          />
          <AutoRefreshDropdown
            onChoose={handleChooseAutoRefresh}
            onManualRefresh={resetCacheAndRefresh}
            selected={autoRefresh}
            showAutoRefresh={false}
          />
          {isFlagEnabled('new-auto-refresh') && (
            <Button
              text={
                autoRefresh?.status &&
                autoRefresh.status === AutoRefreshStatus.Active
                  ? 'Stop Auto Refresh'
                  : 'Enable Auto Refresh'
              }
              color={
                autoRefresh?.status &&
                autoRefresh.status === AutoRefreshStatus.Active
                  ? ComponentColor.Danger
                  : ComponentColor.Primary
              }
              onClick={
                autoRefresh?.status &&
                autoRefresh.status === AutoRefreshStatus.Active
                  ? stopAutoRefreshAndReset
                  : openAutoRefreshModal
              }
              testID="enable-auto-refresh-button"
            />
          )}
        </Page.ControlBarRight>
      </Page.ControlBar>
    </>
  )
}

const mstp = (state: AppState) => {
  const {showVariablesControls} = state.userSettings
  const dashboard = getByID<Dashboard>(
    state,
    ResourceType.Dashboards,
    state.currentDashboard.id
  )

  const timeRange = getTimeRange(state)
  const org = getOrg(state)

  const autoRefresh = state.autoRefresh[state.currentDashboard.id]

  return {
    org,
    dashboard,
    timeRange,
    showVariablesControls,
    autoRefresh,
  }
}

const mdtp = {
  toggleShowVariablesControls: toggleShowVariablesControlsAction,
  updateDashboard: updateDashboardAction,
  onSetAutoRefreshStatus: setAutoRefreshStatusAction,
  updateQueryParams: updateQueryParamsAction,
  setDashboardTimeRange: setDashboardTimeRangeAction,
  setAutoRefreshInterval: setAutoRefreshIntervalAction,
}

const connector = connect(mstp, mdtp)

export default connector(withRouter(DashboardHeader))
