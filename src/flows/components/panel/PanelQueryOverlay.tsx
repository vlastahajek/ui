// Libraries
import React, {useContext, FC, memo} from 'react'
import {withRouter, RouteComponentProps} from 'react-router-dom'
import {get} from 'lodash'

// Components
import {Overlay} from '@influxdata/clockface'
import {CopyToClipboardContext} from 'src/flows/context/panel'
import ClientCodeCopyPage from 'src/writeData/components/ClientCodeCopyPage'
import {FlowQueryContext, Stage} from 'src/flows/context/flow.query'
import {parse} from 'src/external/parser'
import {findNodes} from 'src/shared/utils/ast'
import {CLIENT_DEFINITIONS} from 'src/writeData'
// import {parse} from 'src/external/parser'
// import {findNodes} from 'src/shared/utils/ast'

interface OwnProps {
  panelId: string
}
type Props = OwnProps & RouteComponentProps<{orgID: string}>

const isFromBucket = (node: Node) => {
  return (
    get(node, 'type') === 'CallExpression' &&
    get(node, 'callee.type') === 'Identifier' &&
    get(node, 'callee.name') === 'from' &&
    get(node, 'arguments.0.properties.0.key.name') === 'bucket'
  )
}

const PanelQueryOverlay: FC<Props> = ({panelId}) => {
  // FIXME: Remove this to use a dropdown or similar so we can select the contentID/language
  const contentID = 'python'

  const {generateMap} = useContext(FlowQueryContext)
  const {visible, setVisibility} = useContext(CopyToClipboardContext)

  const getPanelQuery = (panelId: string): string => {
    const stage = generateMap().find((stage: Stage) => {
      return !!stage.instances.find(instance => instance.id == panelId)
    })

    if (!stage) {
      return ''
    }

    const query = stage.text
    const ast = parse(query)
    const bucketsInQuery: string[] = findNodes(ast, isFromBucket).map(node =>
      get(node, 'arguments.0.properties.0.value.value', '')
    )
    console.log('QUERY:', {query, bucketsInQuery})

    return query
  }

  return (
    <Overlay visible={true}>
      <Overlay.Container>
        <Overlay.Header
          title={`Export to ${CLIENT_DEFINITIONS[contentID].name} Client Library`}
          onDismiss={() => setVisibility(!visible)}
        />
        <Overlay.Body>
          <ClientCodeCopyPage
            contentID={contentID}
            query={getPanelQuery(panelId)}
          />
        </Overlay.Body>
      </Overlay.Container>
    </Overlay>
  )
}

export default withRouter(memo(PanelQueryOverlay))
