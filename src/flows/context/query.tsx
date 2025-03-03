import React, {FC, useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {v4 as UUID} from 'uuid'
import {parse, format_from_js_file} from '@influxdata/flux'

import {getOrg} from 'src/organizations/selectors'
import {getBuckets} from 'src/buckets/actions/thunks'
import {getSortedBuckets} from 'src/buckets/selectors'
import {getStatus} from 'src/resources/selectors'
import {fromFlux} from '@influxdata/giraffe'
import {FluxResult, QueryScope, VariableMap} from 'src/types/flows'
import {propertyTime} from 'src/shared/utils/getMinDurationFromAST'

// Constants
import {SELECTABLE_TIME_RANGES} from 'src/shared/constants/timeRanges'
import {API_BASE_PATH} from 'src/shared/constants'
import {
  RATE_LIMIT_ERROR_STATUS,
  RATE_LIMIT_ERROR_TEXT,
} from 'src/cloud/constants'
import {
  TIME_RANGE_START,
  TIME_RANGE_STOP,
  WINDOW_PERIOD,
} from 'src/variables/constants'

// Types
import {
  AppState,
  ResourceType,
  RemoteDataState,
  OptionStatement,
  VariableAssignment,
  ObjectExpression,
  CancellationError,
  File,
} from 'src/types'
import {RunQueryResult} from 'src/shared/apis/query'

interface CancelMap {
  [key: string]: () => void
}

export interface QueryContextType {
  basic: (text: string, override?: QueryScope) => any
  query: (text: string, override?: QueryScope) => Promise<FluxResult>
  cancel: (id?: string) => void
}

export const DEFAULT_CONTEXT: QueryContextType = {
  basic: (_: string, __?: QueryScope) => {},
  query: (_: string, __?: QueryScope) => Promise.resolve({} as FluxResult),
  cancel: (_?: string) => {},
}

export const QueryContext = React.createContext<QueryContextType>(
  DEFAULT_CONTEXT
)

const DESIRED_POINTS_PER_GRAPH = 360
const FALLBACK_WINDOW_PERIOD = 15000

// Finds all instances of nodes that match with the test function
// and returns them as an array
export const find = (node: File, test, acc = []) => {
  if (!node) {
    return acc
  }

  if (test(node)) {
    acc.push(node)
  }

  Object.values(node).forEach(val => {
    if (Array.isArray(val)) {
      val.forEach(_val => {
        find(_val, test, acc)
      })
    } else if (typeof val === 'object') {
      find(val, test, acc)
    }
  })

  return acc
}

// Removes all instances of nodes that match with the test function
// and returns the nodes that were returned as an array
export const remove = (node: File, test, acc = []) => {
  if (!node) {
    return acc
  }

  Object.entries(node).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      let ni = 0
      while (ni < val.length) {
        if (test(val[ni])) {
          acc.push(val[ni])
          val.splice(ni, 1)
          continue
        }
        remove(val[ni], test, acc)
        ni++
      }
    } else if (typeof val === 'object') {
      if (val && test(val)) {
        delete node[key]
      } else {
        remove(val, test, acc)
      }
    }
  })

  return acc
}

const _getVars = (
  ast,
  allVars: VariableMap = {},
  acc: VariableMap = {}
): VariableMap =>
  find(
    ast,
    node => node?.type === 'MemberExpression' && node?.object?.name === 'v'
  )
    .map(node => node.property.name)
    .reduce((tot, curr) => {
      if (tot.hasOwnProperty(curr)) {
        return tot
      }

      if (!allVars[curr]) {
        tot[curr] = null
        return tot
      }
      tot[curr] = allVars[curr]

      if (tot[curr].arguments.type === 'query') {
        _getVars(parse(tot[curr].arguments.values.query), allVars, tot)
      }

      return tot
    }, acc)

const _addWindowPeriod = (ast, optionAST): void => {
  const queryRanges = find(
    ast,
    node =>
      node?.callee?.type === 'Identifier' && node?.callee?.name === 'range'
  ).map(node =>
    (node.arguments[0]?.properties || []).reduce(
      (acc, curr) => {
        if (curr.key.name === 'start') {
          acc.start = propertyTime(ast, curr.value, Date.now())
        }

        if (curr.key.name === 'stop') {
          acc.stop = propertyTime(ast, curr.value, Date.now())
        }

        return acc
      },
      {
        start: '',
        stop: Date.now(),
      }
    )
  )

  if (!queryRanges.length) {
    ;(((optionAST.body[0] as OptionStatement).assignment as VariableAssignment) // eslint-disable-line no-extra-semi
      .init as ObjectExpression).properties.push({
      type: 'Property',
      key: {
        type: 'Identifier',
        name: 'windowPeriod',
      },
      value: {
        type: 'DurationLiteral',
        values: [{magnitude: FALLBACK_WINDOW_PERIOD, unit: 'ms'}],
      },
    })

    return
  }
  const starts = queryRanges.map(t => t.start)
  const stops = queryRanges.map(t => t.stop)
  const cartesianProduct = starts.map(start => stops.map(stop => [start, stop]))

  const durations = []
    .concat(...cartesianProduct)
    .map(([start, stop]) => stop - start)
    .filter(d => d > 0)

  const queryDuration = Math.min(...durations)
  const foundDuration = SELECTABLE_TIME_RANGES.find(
    tr => tr.seconds * 1000 === queryDuration
  )

  if (foundDuration) {
    ;(((optionAST.body[0] as OptionStatement).assignment as VariableAssignment) // eslint-disable-line no-extra-semi
      .init as ObjectExpression).properties.push({
      type: 'Property',
      key: {
        type: 'Identifier',
        name: 'windowPeriod',
      },
      value: {
        type: 'DurationLiteral',
        values: [{magnitude: foundDuration.windowPeriod, unit: 'ms'}],
      },
    })

    return
  }
  ;(((optionAST.body[0] as OptionStatement).assignment as VariableAssignment) // eslint-disable-line no-extra-semi
    .init as ObjectExpression).properties.push({
    type: 'Property',
    key: {
      type: 'Identifier',
      name: 'windowPeriod',
    },
    value: {
      type: 'DurationLiteral',
      values: [
        {
          magnitude: Math.round(queryDuration / DESIRED_POINTS_PER_GRAPH),
          unit: 'ms',
        },
      ],
    },
  })
}

export const simplify = (text, vars: VariableMap = {}) => {
  const ast = parse(text)
  const usedVars = _getVars(ast, vars)

  // Grab all global variables and turn them into a hashmap
  // TODO: move off this variable junk and just use strings
  const globalDefinedVars = Object.values(usedVars).reduce((acc, v) => {
    let _val

    if (!v) {
      return acc
    }

    if (v.id === WINDOW_PERIOD) {
      acc[v.id] = (v.arguments?.values || [10000])[0] + 'ms'

      return acc
    }

    if (v.id === TIME_RANGE_START || v.id === TIME_RANGE_STOP) {
      const val = v.arguments.values[0]

      if (!isNaN(Date.parse(val))) {
        acc[v.id] = new Date(val).toISOString()
        return acc
      }

      if (typeof val === 'string') {
        if (val) {
          acc[v.id] = val
        }

        return acc
      }

      _val = '-' + val[0].magnitude + val[0].unit

      if (_val !== '-') {
        acc[v.id] = _val
      }

      return acc
    }

    if (v.arguments.type === 'map') {
      _val =
        v.arguments.values[
          v.selected ? v.selected[0] : Object.keys(v.arguments.values)[0]
        ]

      if (_val) {
        acc[v.id] = _val
      }

      return acc
    }

    if (v.arguments.type === 'constant') {
      _val = v.selected ? v.selected[0] : v.arguments.values[0]

      if (_val) {
        acc[v.id] = _val
      }

      return acc
    }

    if (v.arguments.type === 'query') {
      if (!v.selected || !v.selected[0]) {
        return
      }

      acc[v.id] = v.selected[0]
      return acc
    }

    return acc
  }, {})

  // Grab all variables that are defined in the query while removing the old definition from the AST
  const queryDefinedVars = remove(
    ast,
    node => node.type === 'OptionStatement' && node.assignment.id.name === 'v'
  ).reduce((acc, curr) => {
    // eslint-disable-next-line no-extra-semi
    ;(curr.assignment?.init?.properties || []).reduce((_acc, _curr) => {
      if (_curr.key?.name && _curr.value?.location?.source) {
        _acc[_curr.key.name] = _curr.value.location.source
      }

      return _acc
    }, acc)

    return acc
  }, {})

  // Merge the two variable maps, allowing for any user defined variables to override
  // global system variables
  const joinedVars = Object.keys(usedVars).reduce((acc, curr) => {
    if (globalDefinedVars.hasOwnProperty(curr)) {
      acc[curr] = globalDefinedVars[curr]
    }

    if (queryDefinedVars.hasOwnProperty(curr)) {
      acc[curr] = queryDefinedVars[curr]
    }

    return acc
  }, {})

  const varVals = Object.entries(joinedVars)
    .map(([k, v]) => `${k}: ${v}`)
    .join(',\n')
  const optionAST = parse(`option v = {\n${varVals}\n}\n`)

  if (varVals.length) {
    ast.body.unshift(optionAST.body[0])
  }

  // Join together any duplicate task options
  const taskParams = remove(
    ast,
    node =>
      node.type === 'OptionStatement' && node.assignment.id.name === 'task'
  )
    .reverse()
    .reduce((acc, curr) => {
      // eslint-disable-next-line no-extra-semi
      ;(curr.assignment?.init?.properties || []).reduce((_acc, _curr) => {
        if (_curr.key?.name && _curr.value?.location?.source) {
          _acc[_curr.key.name] = _curr.value.location.source
        }

        return _acc
      }, acc)

      return acc
    }, {})

  if (Object.keys(taskParams).length) {
    const taskVals = Object.entries(taskParams)
      .map(([k, v]) => `${k}: ${v}`)
      .join(',\n')
    const taskAST = parse(`option task = {\n${taskVals}\n}\n`)
    ast.body.unshift(taskAST.body[0])
  }

  // load in windowPeriod at the last second, because it needs to self reference all the things
  if (usedVars.hasOwnProperty('windowPeriod')) {
    _addWindowPeriod(ast, optionAST)
  }

  // turn it back into a query
  return format_from_js_file(ast)
}

export const QueryProvider: FC = ({children}) => {
  const buckets = useSelector((state: AppState) => getSortedBuckets(state))
  const bucketsLoadingState = useSelector((state: AppState) =>
    getStatus(state, ResourceType.Buckets)
  )
  const [pending, setPending] = useState({} as CancelMap)
  const org = useSelector(getOrg)

  const dispatch = useDispatch()

  useEffect(() => {
    if (bucketsLoadingState === RemoteDataState.NotStarted) {
      dispatch(getBuckets())
    }
  }, [bucketsLoadingState, dispatch])

  // this one cancels all pending queries when you
  // navigate away from the query provider
  useEffect(() => {
    return () => {
      Object.values(pending).forEach(c => c())
    }
  }, [])

  const _getOrg = ast => {
    const queryBuckets = find(
      ast,
      node =>
        node?.type === 'CallExpression' &&
        node?.callee?.type === 'Identifier' &&
        node?.callee?.name === 'from' &&
        node?.arguments[0]?.properties[0]?.key?.name === 'bucket'
    ).map(node => node?.arguments[0]?.properties[0]?.value.value)

    return (
      buckets.find(buck => queryBuckets.includes(buck.name))?.orgID || org.id
    )
  }

  const basic = (text: string, override?: QueryScope) => {
    const query = simplify(text, override?.vars || {})

    // Here we grab the org from the contents of the query, in case it references a sampledata bucket
    const orgID = _getOrg(parse(query))

    const url = `${API_BASE_PATH}api/v2/query?${new URLSearchParams({orgID})}`

    const headers = {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip',
    }

    const body = {
      query,
      dialect: {annotations: ['group', 'datatype', 'default']},
    }

    const controller = new AbortController()

    const id = UUID()
    const promise = fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then(response => {
        if (pending[id]) {
          delete pending[id]
          setPending({...pending})
        }
        return response
      })
      .then(
        (response: Response): Promise<RunQueryResult> => {
          if (response.status === 200) {
            return response.text().then(csv => ({
              type: 'SUCCESS',
              csv,
              bytesRead: csv.length,
              didTruncate: false,
            }))
          }

          if (response.status === RATE_LIMIT_ERROR_STATUS) {
            const retryAfter = response.headers.get('Retry-After')

            return Promise.resolve({
              type: 'RATE_LIMIT_ERROR',
              retryAfter: retryAfter ? parseInt(retryAfter) : null,
              message: RATE_LIMIT_ERROR_TEXT,
            })
          }

          return response.text().then(text => {
            try {
              const json = JSON.parse(text)
              const message = json.message || json.error
              const code = json.code

              return {type: 'UNKNOWN_ERROR', message, code}
            } catch {
              return {
                type: 'UNKNOWN_ERROR',
                message: 'Failed to execute Flux query',
              }
            }
          })
        }
      )
      .catch(e => {
        if (e.name === 'AbortError') {
          return Promise.reject(new CancellationError())
        }

        return Promise.reject(e)
      })

    pending[id] = () => {
      controller.abort()
    }

    setPending({
      ...pending,
    })

    return {
      id,
      promise,
      cancel: () => {
        cancel(id)
      },
    }
  }

  const cancel = (queryID?: string) => {
    if (!queryID) {
      Object.values(pending).forEach(c => c())
      setPending({})
      return
    }

    if (!pending.hasOwnProperty(queryID)) {
      return
    }

    pending[queryID]()

    delete pending[queryID]

    setPending(pending)
  }

  const query = (text: string, override?: QueryScope): Promise<FluxResult> => {
    const result = basic(text, override)

    return result.promise
      .then(raw => {
        if (raw.type !== 'SUCCESS') {
          throw new Error(raw.message)
        }

        return raw
      })
      .then(raw => {
        return new Promise((resolve, reject) => {
          requestAnimationFrame(() => {
            try {
              const parsed = fromFlux(raw.csv)
              resolve({
                source: text,
                parsed,
                error: null,
              } as FluxResult)
            } catch (e) {
              reject(e)
            }
          })
        })
      })
  }

  if (bucketsLoadingState !== RemoteDataState.Done) {
    return null
  }

  return (
    <QueryContext.Provider
      value={{
        query,
        cancel,
        basic,
      }}
    >
      {children}
    </QueryContext.Provider>
  )
}

export default QueryProvider
