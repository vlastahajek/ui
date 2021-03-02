// Libraries
import {Dispatch} from 'react'

// Action Creators
import {
  setWriteStatus,
  setUploadStatus,
  setBody,
  Action,
} from 'src/buckets/components/lineProtocol/LineProtocol.creators'

// APIs
import {postWrite as apiPostWrite} from 'src/client'

// Types
import {RemoteDataState, WritePrecision} from 'src/types'

function onChunkedResponseError(err) {
  console.error(err)
}

function processChunkedResponse(response) {
  let text = ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  return readChunk()

  function readChunk() {
    return reader.read().then(appendChunks)
  }

  function appendChunks(result) {
    const chunk = decoder.decode(result.value || new Uint8Array(), {
      stream: !result.done,
    })
    console.log('got chunk of', chunk.length, 'bytes')
    text += chunk
    console.log('text so far is', text.length, 'bytes\n')
    if (result.done) {
      console.log('returning')
      return text
    } else {
      console.log('recursing')
      return readChunk()
    }
  }
}
export const retrieveLineProtocolFromUrl = (
  dispatch: Dispatch<Action>,
  baseUrl: string,
  params: {url: string}
) => {
  try {
    dispatch(setUploadStatus(RemoteDataState.Loading))
    return fetch(`${baseUrl}?url=${params.url}`)
      .then(r => processChunkedResponse(r, dispatch))
      .then(res => {
        console.log('done', res)
        dispatch(setBody(res))
        dispatch(setUploadStatus(RemoteDataState.Done))
      })
      .catch(onChunkedResponseError)
  } catch (err) {
    dispatch(setUploadStatus(RemoteDataState.Error))
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

    if (resp.status === 204) {
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
  } catch (error) {
    console.error(error)
  }
}
