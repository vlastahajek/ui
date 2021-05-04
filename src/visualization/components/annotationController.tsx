// Redux
import {writeThenFetchAndSetAnnotations} from 'src/annotations/actions/thunks'

import {showOverlay, dismissOverlay} from 'src/overlays/actions/overlays'
import {event} from 'src/cloud/utils/reporting'
import {notify} from 'src/shared/actions/notifications'
import {createAnnotationFailed} from 'src/shared/copy/notifications'
import {getErrorMessage} from 'src/utils/api'

import {InteractionHandlerArguments} from '@influxdata/giraffe'

export const makeAnnotationClickListener = (
  dispatch,
  cellID,
  eventPrefix = 'xyplot'
) => {
  const createAnnotation = async userModifiedAnnotation => {
    const {message, startTime} = userModifiedAnnotation

    try {
      await dispatch(
        writeThenFetchAndSetAnnotations([
          {
            summary: message,
            stream: cellID,
            startTime: new Date(startTime).getTime(),
            endTime: new Date(startTime).getTime(),
          },
        ])
      )
      event(`${eventPrefix}.annotations.create_annotation.create`)
    } catch (err) {
      dispatch(notify(createAnnotationFailed(getErrorMessage(err))))
      event(`${eventPrefix}.annotations.create_annotation.failure`)
    }
  }

  const singleClickHandler = (plotInteraction: InteractionHandlerArguments) => {
    event(`${eventPrefix}.annotations.create_annotation.show_overlay`)
    dispatch(
      showOverlay(
        'add-annotation',
        {
          createAnnotation,
          startTime: plotInteraction?.clampedValueX ?? plotInteraction.valueX,
        },
        () => {
          event(`${eventPrefix}.annotations.create_annotation.cancel`)
          dismissOverlay()
        }
      )
    )
  }

  return singleClickHandler
}

export const makeAnnotationClickHandler = (
  cellID: string,
  dispatch,
  annotations,
  eventPrefix = 'xyplot'
) => {
  console.log('making own here...jill42-ab-88')
  const result = (id: string) => {
    console.log('inside own annotation click....', id)
    const annotationToEdit = annotations[cellID].find(
      annotation => annotation.id === id
    )
    if (annotationToEdit) {
      event(`${eventPrefix}.annotations.edit_annotation.show_overlay`)
      dispatch(
        showOverlay(
          'edit-annotation',
          {clickedAnnotation: {...annotationToEdit, stream: cellID}},
          () => {
            event(`${eventPrefix}.annotations.edit_annotation.cancel`)
            dismissOverlay()
          }
        )
      )
    }
  }

  return result
}
