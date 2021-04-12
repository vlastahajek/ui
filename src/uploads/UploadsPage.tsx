import React, {FC, useState} from 'react'
import {Page} from '@influxdata/clockface'

// Components
import UploadsList from 'src/uploads/UploadsList'
import UploadsHeader from 'src/uploads/UploadsHeader'

// Providers
import LineProtocolProvider from 'src/buckets/components/context/lineProtocol'

const UploadsPage: FC = () => {
  const [searchedUploadTerm, setSearchUploadTerm] = useState<string>('')
  return (
    <>
      <Page titleTag="Uploads">
        <UploadsHeader
          term={searchedUploadTerm}
          setTerm={setSearchUploadTerm}
        />
        <Page.Contents scrollable={true} testID="uploads-page-contents--scroll">
          <LineProtocolProvider>
            <UploadsList term={searchedUploadTerm} />
          </LineProtocolProvider>
        </Page.Contents>
      </Page>
    </>
  )
}

export default UploadsPage
