// Libraries
import React, {PureComponent, MouseEvent} from 'react'
import {connect, ConnectedProps} from 'react-redux'
import {withRouter, RouteComponentProps} from 'react-router-dom'

// Components
import {
  Button,
  SlideToggle,
  ComponentSize,
  ResourceCard,
  IconFont,
  InputLabel,
  FlexBox,
  AlignItems,
  FlexDirection,
  ConfirmationButton,
} from '@influxdata/clockface'
import InlineLabels from 'src/shared/components/inlineLabels/InlineLabels'
import LastRunTaskStatus from 'src/shared/components/lastRunTaskStatus/LastRunTaskStatus'

// Actions
import {addTaskLabel, deleteTaskLabel} from 'src/tasks/actions/thunks'

// Types
import {ComponentColor} from '@influxdata/clockface'
import {Task, Label} from 'src/types'

// Constants
import {DEFAULT_TASK_NAME} from 'src/dashboards/constants'

interface PassedProps {
  task: Task
  onActivate: (task: Task) => void
  onDelete: (task: Task) => void
  onClone: (task: Task) => void
  onRunTask: (taskID: string) => void
  onUpdate: (name: string, taskID: string) => void
  onFilterChange: (searchTerm: string) => void
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = PassedProps & ReduxProps

export class TaskCard extends PureComponent<
  Props & RouteComponentProps<{orgID: string}>
> {
  public render() {
    const {task} = this.props

    return (
      <ResourceCard
        testID="task-card"
        disabled={!this.isTaskActive}
        contextMenu={this.contextMenu}
        contextMenuInteraction="alwaysVisible"
        alignItems={AlignItems.Center}
        margin={ComponentSize.Large}
        direction={FlexDirection.Row}
      >
        <LastRunTaskStatus
          lastRunError={task.lastRunError}
          lastRunStatus={task.lastRunStatus}
        />
        <FlexBox
          alignItems={AlignItems.FlexStart}
          direction={FlexDirection.Column}
          margin={ComponentSize.Medium}
        >
          <ResourceCard.EditableName
            onClick={this.handleNameClick}
            onUpdate={this.handleRenameTask}
            name={task.name}
            noNameString={DEFAULT_TASK_NAME}
            testID="task-card--name"
            buttonTestID="task-card--name-button"
            inputTestID="task-card--input"
          />
          <ResourceCard.Meta>
            {this.activeToggle}
            <>Last completed at {task.latestCompleted}</>
            <>{`Scheduled to run ${this.schedule}`}</>
          </ResourceCard.Meta>
          {this.labels}
        </FlexBox>
      </ResourceCard>
    )
  }

  private get activeToggle(): JSX.Element {
    const labelText = this.isTaskActive ? 'Active' : 'Inactive'
    return (
      <FlexBox margin={ComponentSize.Small}>
        <SlideToggle
          active={this.isTaskActive}
          size={ComponentSize.ExtraSmall}
          onChange={this.changeToggle}
          testID="task-card--slide-toggle"
        />
        <InputLabel active={this.isTaskActive}>{labelText}</InputLabel>
      </FlexBox>
    )
  }

  private get contextMenu(): JSX.Element {
    const {task, onDelete} = this.props

    return (
      <FlexBox margin={ComponentSize.Small}>
        <Button
          text="Export"
          icon={IconFont.Export}
          size={ComponentSize.ExtraSmall}
          onClick={this.handleExport}
        />
        <Button
          text="Run"
          icon={IconFont.Play}
          size={ComponentSize.ExtraSmall}
          onClick={this.handleRun}
        />
        <Button
          text="Run Logs"
          icon={IconFont.Play}
          size={ComponentSize.ExtraSmall}
          onClick={this.handleViewRuns}
        />
        <Button
          text="Clone"
          icon={IconFont.Duplicate}
          size={ComponentSize.ExtraSmall}
          onClick={this.handleClone}
        />
        <ConfirmationButton
          size={ComponentSize.ExtraSmall}
          text="Delete"
          color={ComponentColor.Danger}
          icon={IconFont.Trash}
          confirmationLabel="Are you sure? This cannot be undone"
          confirmationButtonText="Confirm"
          returnValue={task}
          onConfirm={onDelete}
          testID="context-delete"
        />
      </FlexBox>
    )
  }

  private handleNameClick = (event: MouseEvent) => {
    const {
      match: {
        params: {orgID},
      },
      history,
      task,
    } = this.props
    const url = `/orgs/${orgID}/tasks/${task.id}/edit`

    if (event.metaKey) {
      window.open(url, '_blank')
    } else {
      history.push(url)
    }
  }

  private handleViewRuns = () => {
    const {
      history,
      task,
      match: {
        params: {orgID},
      },
    } = this.props
    history.push(`/orgs/${orgID}/tasks/${task.id}/runs`)
  }

  private handleRun = () => {
    const {task, onRunTask} = this.props
    onRunTask(task.id)
  }

  private handleClone = () => {
    const {task, onClone} = this.props
    onClone(task)
  }

  private handleRenameTask = (name: string) => {
    const {
      onUpdate,
      task: {id},
    } = this.props
    onUpdate(name, id)
  }

  private handleExport = () => {
    const {
      history,
      task,
      location: {pathname},
    } = this.props
    history.push(`${pathname}/${task.id}/export`)
  }

  private get labels(): JSX.Element {
    const {task, onFilterChange} = this.props

    return (
      <InlineLabels
        selectedLabelIDs={task.labels}
        onFilterChange={onFilterChange}
        onAddLabel={this.handleAddLabel}
        onRemoveLabel={this.handleRemoveLabel}
      />
    )
  }

  private handleAddLabel = (label: Label) => {
    const {task, onAddTaskLabel} = this.props

    onAddTaskLabel(task.id, label)
  }

  private handleRemoveLabel = (label: Label) => {
    const {task, onDeleteTaskLabel} = this.props

    onDeleteTaskLabel(task.id, label)
  }

  private get isTaskActive(): boolean {
    const {task} = this.props
    if (task.status === 'active') {
      return true
    }
    return false
  }

  private changeToggle = () => {
    const {task, onActivate} = this.props
    if (task.status === 'active') {
      task.status = 'inactive'
    } else {
      task.status = 'active'
    }
    onActivate(task)
  }

  private get schedule(): string {
    const {task} = this.props
    if (task.every && task.offset) {
      return `every ${task.every}, offset ${task.offset}`
    }
    if (task.every) {
      return `every ${task.every}`
    }
    if (task.cron) {
      return task.cron
    }
    return ''
  }
}

const mdtp = {
  onAddTaskLabel: addTaskLabel,
  onDeleteTaskLabel: deleteTaskLabel,
}

const connector = connect(null, mdtp)

export default connector(withRouter(TaskCard))
