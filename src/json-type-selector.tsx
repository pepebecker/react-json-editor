import React from 'react'

interface Props {
  type: string
  disabled?: boolean
  suggestChild?: boolean
  onSelect?(value: string): void
}

const JSONTypeSelector = (props: Props) => {
  return (
    <select
      value={props.type}
      disabled={props.disabled}
      onChange={(ev) => props.onSelect?.(ev.target.value)}
    >
      {props.suggestChild && <option value="child">Child</option>}
      {props.type === 'string' && <option value="parse">Parse</option>}
      <option value="object">Object</option>
      <option value="array">Array</option>
      <option value="string">String</option>
      <option value="number">Number</option>
      <option value="boolean">Boolean</option>
      <option value="null">Null</option>
    </select>
  )
}

export default JSONTypeSelector
