import View from './view'
import './style.scss'

export default register => {
  register({
    type: 'queryBuilder',
    family: 'inputs',
    priority: 1,
    component: View,
    featureFlag: 'flow-panel--query-builder',
    button: 'Query Builder',
    initial: {
      buckets: [],
      tags: [
        {
          key: '_measurement',
          values: [],
          aggregateFunctionType: 'filter',
        },
      ],
    },
    source: data => {
      if (
        !data.buckets[0] ||
        !data.tags.reduce((acc, curr) => acc.concat(curr.values), []).length
      ) {
        return ''
      }

      const tags = data.tags
        .map(tag => {
          if (!tag.key) {
            return ''
          }

          if (tag.aggregateFunctionType === 'filter') {
            if (!tag.values.length) {
              return ''
            }

            const vals = tag.values
              .map(
                value => `r["${tag.key}"] == "${value.replace(/\\/g, '\\\\')}"`
              )
              .join(' or ')

            return `\n  |> filter(fn: (r) => ${vals})`
          }

          if (tag.aggregateFunctionType === 'group') {
            const quotedValues = tag.values.map(value => `"${value}"`) // wrap the value in double quotes

            if (quotedValues.length) {
              return `\n  |> group(columns: [${quotedValues.join(', ')}])` // join with a comma (e.g. "foo","bar","baz")
            }

            return '\n  |> group()'
          }

          return ''
        })
        .join('')

      return `from(bucket: "${data.buckets[0]}") |> range(start: v.timeRangeStart, stop: v.timeRangeStop)${tags}`
    },
  })
}
