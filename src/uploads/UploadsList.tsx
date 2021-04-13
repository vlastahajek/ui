import React, {FC, useContext} from 'react'
import {LineProtocolContext} from 'src/buckets/components/context/lineProtocol'
import {ResourceList} from '@influxdata/clockface'

import UploadCard from 'src/uploads/UploadCard'

interface OwnProps {
  term: string
}
const UploadsEmptyState: FC = () => {
  return <h1>No uploaded data under current criteria has been detected.</h1>
}
const UploadsList: FC<OwnProps> = ({term}) => {
  const {uploads, untrackUpload} = useContext(LineProtocolContext)

  const uploadList: any = Object.values(uploads).filter((upload: any) =>
    upload.url?.includes(term)
  )
  return (
    <ResourceList>
      <ResourceList.Body emptyState={<UploadsEmptyState />}>
        {uploadList.map(upload => (
          <UploadCard
            key={upload.uploadID}
            upload={upload}
            untrack={untrackUpload}
          />
        ))}
      </ResourceList.Body>
    </ResourceList>
  )
}

export default UploadsList
