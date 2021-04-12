import React, {FC, useContext} from 'react'
import {LineProtocolContext} from 'src/buckets/components/context/lineProtocol'
import {ResourceList} from '@influxdata/clockface'

import UploadCard from 'src/uploads/UploadCard'

interface OwnProps {
  term: string
}
const UploadsList: FC<OwnProps> = ({term}) => {
  const {uploads} = useContext(LineProtocolContext)
  console.log(uploads)

  const uploadList: any = Object.values(uploads).filter((upload: any) =>
    upload.url?.includes(term)
  )
  return (
    <ResourceList>
      <ResourceList.Body emptyState={<h1>You aint got no shit here</h1>}>
        {uploadList.map(upload => (
          <UploadCard key={upload.uploadID} upload={upload} />
        ))}
      </ResourceList.Body>
    </ResourceList>
  )
}

export default UploadsList
