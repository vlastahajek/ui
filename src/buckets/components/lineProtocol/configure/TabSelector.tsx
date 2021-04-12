// Libraries
import React, {FC, useContext} from 'react'
import {SelectGroup, ButtonShape} from '@influxdata/clockface'

// Components
import Tab from 'src/buckets/components/lineProtocol/configure/Tab'
import {LineProtocolContext} from 'src/buckets/components/context/lineProtocol'

// Types
import {LineProtocolTab} from 'src/types'

// Feature Flag
import {isFlagEnabled} from 'src/shared/utils/featureFlag'

const tabs: LineProtocolTab[] = isFlagEnabled('lineProtocolURL')
  ? ['Upload File', 'Enter Manually', 'Upload From URL']
  : ['Upload File', 'Enter Manually']

const TabSelector: FC = () => {
  const {handleSetTab, tab: activeTab} = useContext(LineProtocolContext)
  const handleTabClick = (tab: LineProtocolTab) => {
    if (tab !== activeTab) {
      handleSetTab(tab)
    }
  }

  return (
    <SelectGroup shape={ButtonShape.Default}>
      {tabs.map(tab => (
        <Tab
          tab={tab}
          key={tab}
          active={activeTab === tab}
          onClick={handleTabClick}
        />
      ))}
    </SelectGroup>
  )
}

export default TabSelector
