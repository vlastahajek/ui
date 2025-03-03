import React, {FC, useContext, useMemo, useCallback} from 'react'
import {PipeData, FluxResult} from 'src/types/flows'
import {FlowContext} from 'src/flows/context/flow.current'
import {ResultsContext} from 'src/flows/context/results'
import {FlowQueryContext} from 'src/flows/context/flow.query'
import {RemoteDataState, TimeRange} from 'src/types'

export interface PipeContextType {
  id: string
  data: PipeData
  range: TimeRange
  update: (data: PipeData) => void
  loading: RemoteDataState
  results: FluxResult
  readOnly: boolean
}

export const DEFAULT_CONTEXT: PipeContextType = {
  id: '',
  data: {},
  range: null,
  update: () => {},
  loading: RemoteDataState.NotStarted,
  results: {
    source: '',
    parsed: {},
  } as FluxResult,
  readOnly: false,
}

export const PipeContext = React.createContext<PipeContextType>(DEFAULT_CONTEXT)

interface PipeContextProps {
  id: string
}

export const PipeProvider: FC<PipeContextProps> = ({id, children}) => {
  const {flow} = useContext(FlowContext)
  const results = useContext(ResultsContext)
  const {getStatus} = useContext(FlowQueryContext)

  const updater = useCallback(
    (_data: PipeData) => {
      flow.data.update(id, _data)
    },
    [flow, id]
  )

  let _result

  try {
    _result = results.get(id)
  } catch (_e) {
    _result = {...DEFAULT_CONTEXT.results}
  }

  return useMemo(() => {
    let data = null
    const loading = getStatus(id)
    try {
      data = flow.data.get(id)
    } catch {
      return null
    }
    return (
      <PipeContext.Provider
        value={{
          id: id,
          data,
          range: flow.range,
          update: updater,
          results: _result,
          loading,
          readOnly: flow.readOnly,
        }}
      >
        {children}
      </PipeContext.Provider>
    )
  }, [flow, id, _result, children, updater])
}
