import View from './view'
import './style.scss'

export default register => {
  register({
    type: 'query',
    family: 'transform',
    priority: 1,
    component: View,
    button: 'Flux Script',
    initial: {
      activeQuery: 0,
      queries: [
        {
          text:
            '// Write Flux script here\n// use __PREVIOUS_RESULT__ to continue building from the previous cell',
          editMode: 'advanced',
          builderConfig: {
            buckets: [],
            tags: [],
            functions: [],
          },
        },
      ],
    },
  })
}