import React, { useCallback, useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { camelCase, camelCaseTransformMerge } from 'camel-case'

import {
  generateKey,
  getType,
  insertKeyValueAfter,
  renameKey,
  replaceInArray,
} from './utils'
import { TypeMap } from './type-map'
import Indent from './indent'
import JSONTypeSelector from './json-type-selector'

type JSONPrimeValue = string | number | boolean | null
type JSONValue =
  | JSONPrimeValue
  | JSONPrimeValue[]
  | { [key: string]: JSONPrimeValue }

interface Props {
  canRename?: boolean
  depth?: number
  expended?: boolean
  filteredPaths?: string[]
  hiddenKeys?: string[]
  lockedKeys?: string[]
  isRoot?: boolean
  name?: string
  newKeyDefault?: string
  newValueDefault?: string
  parent?: any[] | { [key: string]: any }
  path: string
  showType?: boolean
  styles: { [key: string]: string }
  typeBackgrounds?: TypeMap
  typeColors?: TypeMap
  value: JSONValue
  nameForItemInList?(index: number, parentKey?: string): string
  valueForObject?(object: { [key: string]: JSONValue }): string
  valueForArray?(array: JSONValue[]): string
  onChange(value: JSONValue): void
  onChangeName?(name: string): void
  onDelete?(): void
  onAdd?(): void
  renderButton(props: {
    type: 'delete' | 'duplicate'
    disabled?: boolean
    onClick?: () => any
  }): React.ReactElement
}

const JSONField = (props: Props) => {
  const depth = props.depth || 0
  const newKeyDefault = props.newKeyDefault || 'newKey'

  const [firstRenderCompleted, setFirstRenderCompleted] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, _setName] = useState(props.name || (props.isRoot ? 'Root' : ''))
  const [value, setValue] = useState(props.value)
  const [type, _setType] = useState(getType(props.value))
  const [invalid, setInvalid] = useState(false)

  const isObjectOrArray = !!value && (type === 'object' || type === 'array')
  const childrenCount = isObjectOrArray ? Object.keys(value!).length : 0

  useEffect(() => setFirstRenderCompleted(true), [])

  useEffect(() => _setName(props.name!), [props.name])
  useEffect(() => {
    setValue(props.value)
    _setType(getType(props.value))
  }, [props.value, _setType])

  const onChangeDebounced = useDebouncedCallback(props.onChange, 500)

  const onChange = useCallback(
    (value: JSONValue, debounce = false) => {
      setValue(value)
      if (debounce) onChangeDebounced(value)
      else props.onChange(value)
    },
    [setValue, onChangeDebounced, props.onChange]
  )

  const setName = useCallback(
    (newName: string) => {
      _setName(newName)
      const existingName = props.parent ? newName in props.parent : false
      const sameName = props.name == newName
      setInvalid(!newName || (!sameName && existingName))
    },
    [props.name, props.parent, _setName, setInvalid]
  )

  const submitNewName = useCallback(() => {
    if (!invalid) {
      props.onChangeName?.(name)
      setEditingName(false)
    }
  }, [invalid, name, setEditingName, props.onChangeName])

  const setType = useCallback(
    (newType: string) => {
      let newValue: JSONValue = null
      switch (newType) {
        case 'numer':
          newValue = Number(value)
          break
        case 'boolean':
          newValue = Boolean(value)
          break
        case 'null':
          newValue = null
          break
        case 'string':
          if (value && typeof value === 'object')
            newValue = JSON.stringify(value)
          else newValue = value?.toString() || ''
          break
        case 'child':
          if (isObjectOrArray) newValue = Object.values(value!)[0]
          break
        case 'parse':
          try {
            if (typeof value === 'string') {
              newValue = JSON.parse(value)
            } else {
              throw 'not string'
            }
          } catch (err) {
            newValue = value
            newType = type
          }
          break
        case 'array':
          if (value && typeof value === 'object') {
            newValue = Object.values(value)
          } else {
            newValue = [value] as JSONValue
          }
          break
        case 'object':
          try {
            if (Array.isArray(value)) {
              newValue = Object.fromEntries(
                value.map((v, i) => {
                  const customKey = props.nameForItemInList?.(i, name)
                  const k = customKey
                    ? camelCase(customKey, {
                        transform: camelCaseTransformMerge,
                      })
                    : newKeyDefault + 1
                  return [k, v]
                })
              )
            }
            if (!newValue || typeof newValue !== 'object') throw 'not object'
          } catch (err) {
            newValue = { [newKeyDefault]: value } as JSONValue
          }
          break
        default:
          break
      }
      if (newValue === 'NaN' || Number.isNaN(newValue)) newValue = 0
      _setType(newType)
      setValue(newValue)
      onChange(newValue)
    },
    [value, type, name, _setType, setValue, onChange, props.nameForItemInList]
  )

  const renderNameInput = () => {
    return (
      <input
        type="text"
        className={
          props.styles.nameInput + ' ' + (invalid && props.styles.invalid)
        }
        value={name}
        onChange={(ev) => setName(ev.target.value)}
        onBlur={() => {
          if (invalid) setName(props.name!)
          else props.onChangeName?.(name)
          setEditingName(false)
        }}
        onKeyDown={(ev) => ev.key === 'Enter' && submitNewName()}
      />
    )
  }

  const renderString = (value: string) => {
    return (
      <input
        type="text"
        className={props.styles.valueInput}
        value={value}
        onChange={(ev) => onChange(ev.target.value, true)}
      />
    )
  }

  const renderNumber = (value: number) => {
    return (
      <input
        type="number"
        className={props.styles.valueInput}
        value={value}
        onChange={(ev) => onChange(Number(ev.target.value), true)}
      />
    )
  }

  const renderBoolean = (value: boolean) => {
    return (
      <label className={props.styles.checkBoxLabel}>
        <input
          type="checkbox"
          checked={value}
          onChange={(ev) => onChange(ev.target.checked, true)}
        />
      </label>
    )
  }

  const renderNull = () => {
    return <span>null</span>
  }

  const renderArray = (array: any[]) => {
    if (!firstRenderCompleted) {
      return []
    }
    return array.map((entry, i) => {
      const path = props.path + `[${i}]`
      if (props.filteredPaths && !props.filteredPaths?.includes(path)) {
        return null
      }
      return (
        <JSONField
          depth={depth + 1}
          filteredPaths={props.filteredPaths}
          lockedKeys={props.lockedKeys}
          hiddenKeys={props.hiddenKeys}
          showType={props.showType}
          key={i}
          name={props.nameForItemInList?.(i, props.name) || `item ${i}`}
          newKeyDefault={props.newKeyDefault}
          newValueDefault={props.newValueDefault}
          parent={array}
          path={path}
          styles={props.styles}
          typeBackgrounds={props.typeBackgrounds}
          typeColors={props.typeColors}
          value={entry}
          renderButton={props.renderButton}
          nameForItemInList={props.nameForItemInList}
          valueForObject={props.valueForObject}
          valueForArray={props.valueForArray}
          onChange={(value) => {
            onChange(replaceInArray(array, i, value))
          }}
          onDelete={() => {
            const newArray = JSON.parse(JSON.stringify(array))
            newArray.splice(i, 1)
            onChange(newArray)
          }}
          onAdd={() => {
            array.splice(i + 1, 0, array[i])
            onChange(JSON.parse(JSON.stringify(array)))
          }}
        />
      )
    })
  }

  const renderObject = (object: any) => {
    if (!firstRenderCompleted) {
      return []
    }
    return Object.keys(object).map((name, i) => {
      if (props.hiddenKeys?.includes(name)) return null
      const path = props.path + '.' + name
      if (props.filteredPaths && !props.filteredPaths?.includes(path)) {
        return null
      }
      return (
        <JSONField
          depth={depth + 1}
          filteredPaths={props.filteredPaths}
          lockedKeys={props.lockedKeys}
          hiddenKeys={props.hiddenKeys}
          showType={props.showType}
          key={i}
          name={name}
          newKeyDefault={props.newKeyDefault}
          newValueDefault={props.newValueDefault}
          parent={object}
          path={path}
          styles={props.styles}
          typeBackgrounds={props.typeBackgrounds}
          typeColors={props.typeColors}
          value={object[name]}
          renderButton={props.renderButton}
          nameForItemInList={props.nameForItemInList}
          valueForObject={props.valueForObject}
          valueForArray={props.valueForArray}
          onChange={(value) => {
            onChange({ ...object, [name]: value })
          }}
          onChangeName={(newName) => {
            onChange(renameKey(object, name, newName))
          }}
          onDelete={() => {
            delete object[name]
            onChange(object)
          }}
          onAdd={() => {
            const newKey = generateKey(name, object)
            const newObject = insertKeyValueAfter(
              object,
              name,
              newKey,
              object[name]
            )
            onChange(JSON.parse(JSON.stringify(newObject)))
          }}
          canRename
        />
      )
    })
  }

  const renderValueCellContent = () => {
    if (value && typeof value === 'object') {
      if (props.valueForArray && Array.isArray(value))
        return props.valueForArray(value)
      if (props.valueForObject && !Array.isArray(value))
        return props.valueForObject(value)
      return `(${childrenCount} items)`
    } else {
      if (typeof value === 'string') return renderString(value)
      if (typeof value === 'number') return renderNumber(value)
      if (typeof value === 'boolean') return renderBoolean(value)
      return renderNull()
    }
  }

  const renderValueCell = () => {
    const style = {
      background: props.typeBackgrounds?.[type],
      color: props.typeColors?.[type],
    }
    return (
      <td
        className={props.styles.valueCell + ' ' + props.styles[type]}
        style={style}
      >
        {renderValueCellContent()}
      </td>
    )
  }

  const hasMultipleKeys = props.parent && Object.keys(props.parent).length > 1
  const canDelete = !props.isRoot && hasMultipleKeys
  const isLocked = props.lockedKeys?.includes(name)

  return (
    <React.Fragment>
      <tr>
        <td className={props.styles.keyCell}>
          <span className={props.styles.keyCellContent}>
            <Indent depth={depth} styles={props.styles}>
              <label className={props.styles.name}>
                {props.canRename && editingName ? (
                  renderNameInput()
                ) : (
                  <span
                    className={`${props.styles.nameText} ${
                      isLocked
                        ? props.styles.locked
                        : props.canRename
                        ? props.styles.editable
                        : ''
                    }`}
                    onClick={() => {
                      if (props.canRename && !isLocked)
                        return setEditingName(true)
                    }}
                  >
                    {name}
                  </span>
                )}
              </label>
            </Indent>
            {!props.isRoot && !isLocked && (
              <span className={props.styles.actions}>
                {props.renderButton?.({
                  type: 'delete',
                  disabled: !canDelete,
                  onClick: props.onDelete,
                })}
                {props.renderButton?.({
                  type: 'duplicate',
                  onClick: props.onAdd,
                })}
              </span>
            )}
          </span>
        </td>
        {props.showType && (
          <td className={props.styles.typeCell}>
            <JSONTypeSelector
              type={type}
              onSelect={setType}
              disabled={isLocked}
              suggestChild={isObjectOrArray && childrenCount === 1}
            />
          </td>
        )}
        {renderValueCell()}
      </tr>
      {type === 'object' && renderObject(value)}
      {Array.isArray(value) && renderArray(value)}
    </React.Fragment>
  )
}

export default JSONField
