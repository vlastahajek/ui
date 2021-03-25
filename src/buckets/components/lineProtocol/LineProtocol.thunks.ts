// Libraries
import {Dispatch} from 'react'

// Action Creators
import {
  setWriteStatus,
  setUploadStatus,
  setPreview,
  Action,
} from 'src/buckets/components/lineProtocol/LineProtocol.creators'

// APIs
import {postWrite as apiPostWrite} from 'src/client'

// Types
import {RemoteDataState, WritePrecision} from 'src/types'

export const retrieveLineProtocolFromUrl = async (
  dispatch: Dispatch<Action>,
  params: {url: string}
) => {
  try {
    dispatch(setUploadStatus(RemoteDataState.Loading))
    const lineProtocolUploadResponse = await fetch(
      `/api/v2/url/preview?url=${params.url}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const parsedResponse = await lineProtocolUploadResponse.text()
    dispatch(setPreview(parsedResponse))
    dispatch(setUploadStatus(RemoteDataState.Done))
  } catch (err) {
    dispatch(setUploadStatus(RemoteDataState.Error))
    console.error(err)
  }
}

const handleLineProtocolWriteResponseStatus = (
  dispatch: Dispatch<Action>,
  resp: any
) => {
  if (resp.status === 200 || resp.status === 204) {
    dispatch(setWriteStatus(RemoteDataState.Done))
  } else if (resp.status === 429) {
    dispatch(
      setWriteStatus(
        RemoteDataState.Error,
        'Failed due to plan limits: read cardinality reached'
      )
    )
  } else if (resp.status === 403) {
    dispatch(setWriteStatus(RemoteDataState.Error, resp.data.message))
  } else {
    const message = resp?.data?.message || 'Failed to write data'
    if (resp?.data?.code === 'invalid') {
      dispatch(
        setWriteStatus(
          RemoteDataState.Error,
          'Failed to write data - invalid line protocol submitted'
        )
      )
    } else {
      dispatch(setWriteStatus(RemoteDataState.Error, message))
    }
    throw new Error(message)
  }
}

export const writeLineProtocolStream = async (
  dispatch: Dispatch<Action>,
  params: {url: string},
  options?: {
    bucket: string
    org: string
    precision: string
  }
) => {
  try {
    const {bucket, org, precision} = options
    dispatch(setWriteStatus(RemoteDataState.Loading))

    const resp = await fetch(
      `/api/v2/url/send?url=${params.url}&bucket=${bucket}&org=${org}&precision=${precision}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    handleLineProtocolWriteResponseStatus(dispatch, resp)
  } catch (err) {
    console.error(err)
  }
}

export const writeLineProtocolAction = async (
  dispatch: Dispatch<Action>,
  org: string,
  bucket: string,
  body: string,
  precision: WritePrecision
) => {
  try {
    dispatch(setWriteStatus(RemoteDataState.Loading))

    const resp = await apiPostWrite({
      data: body,
      query: {org, bucket, precision},
    })

    handleLineProtocolWriteResponseStatus(dispatch, resp)
  } catch (error) {
    console.error(error)
  }
}
