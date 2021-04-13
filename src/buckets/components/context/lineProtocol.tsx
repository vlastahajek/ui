// Libraries
import React, {FC, useCallback, useState, useEffect} from 'react'
import {useSelector, useDispatch} from 'react-redux'

// Utils
import {postWrite} from 'src/client'
import {getErrorMessage} from 'src/utils/api'

// Selectors
import {getOrg} from 'src/organizations/selectors'
import {getMe} from 'src/me/selectors'

// Notifications
import {
  urlUploadSuccessNotification,
  urlUploadFailureNotification,
} from 'src/shared/copy/notifications'
import {notify} from 'src/shared/actions/notifications'

// Types
import {RemoteDataState, LineProtocolTab, WritePrecision} from 'src/types'

export type Props = {
  children: JSX.Element
}

export interface LineProtocolContextType {
  body: string
  handleResetLineProtocol: () => void
  handleSetBody: (_: string) => void
  handleSetTab: (tab: LineProtocolTab) => void
  precision: WritePrecision
  preview: string
  retrieveLineProtocolFromUrl: (url: string) => void
  setPrecision: (_: WritePrecision) => void
  untrackUpload: (_: string) => void
  uploadStatus: RemoteDataState
  uploads: any
  tab: LineProtocolTab
  userID: string
  writeError: string
  writeLineProtocol: (_: string) => void
  writeLineProtocolStream: (url: string, bucket: string) => Promise<void>
  writeStatus: RemoteDataState
}

export const DEFAULT_CONTEXT: LineProtocolContextType = {
  body: '',
  handleResetLineProtocol: () => {},
  handleSetBody: (_: string) => {},
  handleSetTab: (_: LineProtocolTab) => {},
  precision: WritePrecision.Ns,
  preview: '',
  retrieveLineProtocolFromUrl: (_url: string) => {},
  setPrecision: (_: WritePrecision) => {},
  tab: 'Upload File',
  untrackUpload: (_: string) => {},
  uploadStatus: RemoteDataState.NotStarted,
  uploads: {},
  userID: '',
  writeError: '',
  writeLineProtocol: (_: string) => {},
  writeLineProtocolStream: (_url: string, _bucket: string) => Promise.resolve(),
  writeStatus: RemoteDataState.NotStarted,
}

export const LineProtocolContext = React.createContext<LineProtocolContextType>(
  DEFAULT_CONTEXT
)

export const LineProtocolProvider: FC<Props> = React.memo(({children}) => {
  const dispatch = useDispatch()

  const [body, setBody] = useState('')
  const [preview, setPreview] = useState('')
  const [tab, setTab] = useState<LineProtocolTab>('Upload File')
  const [precision, setPrecision] = useState(WritePrecision.Ns)
  const [uploadStatus, setUploadStatus] = useState(RemoteDataState.NotStarted)
  const [writeStatus, setWriteStatus] = useState(RemoteDataState.NotStarted)
  const [writeError, setWriteError] = useState('')
  const [uploadRecords, setUploadRecords] = useState<any>({})

  const org = useSelector(getOrg).name
  const {id: userID} = useSelector(getMe)

  const handleResetLineProtocol = useCallback(() => {
    setBody('')
    setPreview('')
    setUploadStatus(RemoteDataState.NotStarted)
    setWriteStatus(RemoteDataState.NotStarted)
    setWriteError('')
  }, [])

  useEffect(() => {
    const client = new WebSocket(`wss://${window.location.host}/api/v2/url/`)

    client.onopen = () => {
      client.send(JSON.stringify({userID, channel: '/register/user'}))
    }

    client.onmessage = function incoming({data}) {
      // this will be the message that fires when the upload is finished for that user!
      const {linesTotal, state, error, uploads, eventname} = JSON.parse(data)
      if (eventname === 'uploadResponse') {
        if (state === 'success') {
          dispatch(
            notify(
              urlUploadSuccessNotification(
                `Successfully uploaded ${linesTotal} lines of line protocol!`
              )
            )
          )
        } else if (state === 'error') {
          dispatch(notify(urlUploadFailureNotification(error?.message)))
        }
      }
      setUploadRecords(uploads)
    }

    client.onerror = err => {
      console.error(err)
    }
    return () => {
      window.addEventListener('beforeunload', () => {
        client.close()
      })
    }
  }, [])

  const untrackUpload = useCallback(async (uploadID: string) => {
    try {
      const res = await fetch(
        `/api/v2/url/uploads?userID=${userID}&uploadID=${uploadID}`,
        {
          method: 'DELETE',
        }
      )
      const parsedRes = await res.json()
      setUploadRecords(parsedRes.uploads)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const retrieveLineProtocolFromUrl = useCallback(
    async (url: string) => {
      try {
        setUploadStatus(RemoteDataState.Loading)
        const lineProtocolUploadResponse = await fetch(`/api/v2/url/preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({url, userID}),
        })

        const parsedResponse = await lineProtocolUploadResponse.text()
        setPreview(parsedResponse)
        setUploadStatus(RemoteDataState.Done)
      } catch (err) {
        setUploadStatus(RemoteDataState.Error)
        console.error(err)
      }
    },
    [userID]
  )

  const handleLineProtocolWriteResponseStatus = useCallback((resp: any) => {
    if (resp.status === 200 || resp.status === 204) {
      setWriteStatus(RemoteDataState.Done)
    } else if (resp.status === 429) {
      setWriteStatus(RemoteDataState.Error)
      setWriteError('Failed due to plan limits: read cardinality reached')
    } else if (resp.status === 403) {
      const error = getErrorMessage(resp)
      setWriteStatus(RemoteDataState.Error)
      setWriteError(error)
    } else {
      const message = getErrorMessage(resp) || 'Failed to write data'
      if (resp?.data?.code === 'invalid') {
        setWriteStatus(RemoteDataState.Error)
        setWriteError('Failed to write data - invalid line protocol submitted')
      } else {
        setWriteStatus(RemoteDataState.Error)
        setWriteError(message)
      }
      throw new Error(message)
    }
  }, [])

  const writeLineProtocolStream = useCallback(
    async (url: string, bucket: string) => {
      try {
        setWriteStatus(RemoteDataState.Loading)
        const resp = await fetch(`/api/v2/url/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bucket,
            org,
            precision,
            url,
            userID,
            baseurl: window.location.host,
          }),
        })

        handleLineProtocolWriteResponseStatus(resp)
      } catch (err) {
        console.error(err)
      }
    },
    [userID, org, precision, handleLineProtocolWriteResponseStatus]
  )

  const writeLineProtocol = useCallback(
    async (bucket: string) => {
      try {
        setWriteStatus(RemoteDataState.Loading)
        const resp = await postWrite({
          data: body,
          query: {org, bucket, precision},
        })

        handleLineProtocolWriteResponseStatus(resp)
      } catch (error) {
        console.error(error)
      }
    },
    [body, org, precision, handleLineProtocolWriteResponseStatus]
  )

  const handleSetTab = useCallback(
    (tab: LineProtocolTab) => {
      setBody('')
      setTab(tab)
    },
    [setTab, setBody]
  )

  const handleSetBody = useCallback(
    (b: string) => {
      setBody(b)
    },
    [setBody]
  )

  return (
    <LineProtocolContext.Provider
      value={{
        body,
        handleSetBody,
        handleResetLineProtocol,
        handleSetTab,
        precision,
        setPrecision,
        tab,
        writeError,
        writeLineProtocol,
        writeStatus,
        uploadStatus,
        preview,
        retrieveLineProtocolFromUrl,
        untrackUpload,
        uploads: uploadRecords,
        userID,
        writeLineProtocolStream,
      }}
    >
      {children}
    </LineProtocolContext.Provider>
  )
})

export default LineProtocolProvider
