// Libraries
import React, {PureComponent} from 'react'
import {connect, ConnectedProps} from 'react-redux'

// Components
import {
  Dropdown,
  DropdownMenuTheme,
  ComponentStatus,
  Input,
} from '@influxdata/clockface'

// Actions
import {selectValue} from 'src/variables/actions/thunks'

// Utils
import {getVariable, normalizeValues} from 'src/variables/selectors'

// Types
import {AppState, RemoteDataState} from 'src/types'

interface OwnProps {
  variableID: string
  testID?: string
  onSelect?: () => void
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

class VariableDropdown extends PureComponent<Props> {

  constructor(props){
    super(props)
    this.state = {
      typedText: '',
      shownValues:props.values,
    }
  }

  componentDidUpdate(prevProps){
    const prevVals = prevProps.values
    const values = this.props.values

    if (prevVals.length !== values.length){
      this.setState({shownValues:values})
    }
  }

  const filterVals = (ack) => {
    const {values} = this.props

    const result = values.filter(val =>
        val.toLowerCase().indexOf(ack.toLowerCase()) !== -1
    )

    console.log("filtering??? jill-ack1", result)

    this.setState({shownValues:result, typedValue: ack})
  }

  render() {
    const {selectedValue, values, name} = this.props
    const {typedValue, shownValues} = this.state

    const dropdownStatus =
      values.length === 0 ? ComponentStatus.Disabled : ComponentStatus.Default

    const longestItemWidth = Math.floor(
      values.reduce(function(a, b) {
        return a.length > b.length ? a : b
      }, '').length * 9.5
    )

    const widthLength = Math.max(140, longestItemWidth)

    // const textInput =   <Input
    //     placeholder='select a value'
    //     onChange={e => filterVals(e.target.value)}
    //     value={typedValue || getSelectedText()}
    // />;

console.log("jill23...shownValues??", this.state.shownValues)
    console.log('jill23....actual vals?', values);




    return (
      <Dropdown
        style={{width: '140px'}}
        className="variable-dropdown--dropdown"
        testID={this.props.testID || `variable-dropdown--${name}`}
        button={(active, onClick) => (
          <Dropdown.Button
            active={active}
            onClick={onClick}
            testID="variable-dropdown--button"
            status={dropdownStatus}
          >  <Input
              placeholder='select a value'
              onChange={e => this.filterVals(e.target.value)}
              value={typedValue || this.selectedText}
          />

          </Dropdown.Button>
        )}
        menu={onCollapse => (
          <Dropdown.Menu
            style={{width: `${widthLength}px`}}
            onCollapse={onCollapse}
            theme={DropdownMenuTheme.Amethyst}
          >
            {shownValues.map(val => {
              return (
                <Dropdown.Item
                  key={val}
                  id={val}
                  value={val}
                  onClick={this.handleSelect}
                  selected={val === selectedValue}
                  testID="variable-dropdown--item"
                  className="variable-dropdown--item"
                >
                  {val}
                </Dropdown.Item>
              )
            })}
          </Dropdown.Menu>
        )}
      />
    )
  }

  private handleSelect = (selectedValue: string) => {
    const {
      variableID,
      onSelectValue,
      onSelect,
      selectedValue: prevSelectedValue,
    } = this.props

    if (prevSelectedValue !== selectedValue) {
      onSelectValue(variableID, selectedValue)
    }

    if (onSelect) {
      onSelect()
    }
  }

  private get selectedText() {
    const {selectedValue, status} = this.props
    if (status === RemoteDataState.Loading) {
      return 'Loading'
    }

    if (selectedValue) {
      return selectedValue
    }

    return 'No Values'
  }
}

const mstp = (state: AppState, props: OwnProps) => {
  const {variableID} = props
  const variable = getVariable(state, variableID)
  const selected =
    variable.selected && variable.selected.length ? variable.selected[0] : null

  return {
    status: variable.status,
    values: normalizeValues(variable),
    selectedValue: selected,
    name: variable.name,
  }
}

const mdtp = {
  onSelectValue: selectValue,
}

const connector = connect(mstp, mdtp)

export default connector(VariableDropdown)
