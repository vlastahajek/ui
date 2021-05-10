// Libraries
import React, {FC} from 'react'
import {Renderer} from 'react-markdown'

// Components
import WriteDataHelper from 'src/writeData/components/WriteDataHelper'
import WriteDataCodeSnippet from 'src/writeData/components/WriteDataCodeSnippet'
import WriteDataDetailsContextProvider from 'src/writeData/components/WriteDataDetailsContext'
import GetResources from 'src/resources/components/GetResources'
import {CodeSampleBlock} from 'src/writeData/containers/ClientLibrariesPage'

// Constants
import {CLIENT_DEFINITIONS} from 'src/writeData'

// Types
import {ResourceType} from 'src/types'

// Styles
import 'src/writeData/components/WriteDataDetailsView.scss'
import InstallPackageHelper from './InstallPackageHelper/index'

const codeRenderer: Renderer<HTMLPreElement> = (props: any): any => {
  return <WriteDataCodeSnippet code={props.value} language={props.language} />
}

interface Props {
  contentID: string
  query: string
}

const ClientCodeCopyPage: FC<Props> = ({contentID, query}) => {
  const def = CLIENT_DEFINITIONS[contentID]
  console.log({def, contentID, query, CLIENT_DEFINITIONS})

  let description

  if (def.description) {
    description = (
      <InstallPackageHelper
        text={def.description}
        codeRenderer={codeRenderer}
      />
    )
  }

  return (
    <GetResources
      resources={[ResourceType.Authorizations, ResourceType.Buckets]}
    >
      <WriteDataDetailsContextProvider>
        <div className="write-data--details">
          <div
            className="write-data--details-content markdown-format"
            data-testid="load-data-details-content"
          >
            <WriteDataHelper />
            {description}
            <CodeSampleBlock
              name="Initialize and Execute Flux"
              sample={`${def.initialize}${def.execute}`}
              query={query}
            />
          </div>
        </div>
      </WriteDataDetailsContextProvider>
    </GetResources>
  )
}

export default ClientCodeCopyPage
