import * as React from 'react'
import getPaths from 'deepdash-es/paths'

import styles from './styles.module.css'
import { createCopy, getPathsTree, isJsonPath } from './utils'
import { TypeMap } from './type-map'
import JSONField from './json-field'

interface Props {
  value: any
  hiddenPaths?: string[]
  hiddenKeys?: string[]
  lockedKeys?: string[]
  newKeyDefault?: string
  newValueDefault?: string
  query?: string
  rootName?: string
  showType?: boolean
  typeBackgrounds?: TypeMap
  typeColors?: TypeMap
  onChange?(data: any): void
  nameForItemInList?(index: number, parentKey?: string): string
  valueForObject?(object: { [key: string]: any }): string
  valueForArray?(array: any[]): string
  renderButton?(props: {
    type: 'delete' | 'duplicate'
    disabled?: boolean
    onClick?: () => any
  }): React.ReactElement
}

const createQueryRegex = (query?: string, isPath = false) => {
  if (!query) return null
  try {
    const escapedQuery = query?.replace(/([.[\]])/g, '\\$&')
    const prefix = isPath ? '^' : ''
    return new RegExp(prefix + escapedQuery.replace(/\*/g, '\\d'), 'i')
  } catch (error) {}
  return null
}

const JSONEditor = React.memo((props: Props) => {
  const [queryRegex, setQueryRegex] = React.useState<RegExp>()
  const [paths, setPaths] = React.useState<string[]>([])
  const [filteredPaths, setFilteredPaths] = React.useState<Array<string>>()
  React.useEffect(() => {
    if (props.query) {
      const isPath = isJsonPath(props.query)
      setQueryRegex(createQueryRegex(props.query, isPath) || undefined)
    } else {
      setQueryRegex(undefined)
    }
  }, [props.query])
  React.useEffect(() => {
    setPaths(
      getPaths(props.value, { leavesOnly: false }).map((p) =>
        !isJsonPath(p as string) ? '.' + p : p
      ) as string[]
    )
  }, [props.value])
  React.useEffect(() => {
    const hasHiddenPaths = props.hiddenPaths && props.hiddenPaths?.length > 0
    if (queryRegex || hasHiddenPaths) {
      const filteredPaths = paths.filter((p) => {
        const hidden = props.hiddenPaths?.reduce((hidden, hp) => {
          return hidden || (hp ? p.includes(hp) : false)
        }, false)
        if (hidden) return false
        if (queryRegex) return queryRegex.test(p)
        return true
      }) as string[]

      const extendedPaths = filteredPaths.reduce((acc, path) => {
        return [...acc, ...getPathsTree(path)]
      }, filteredPaths)
      setFilteredPaths(extendedPaths)
    } else {
      setFilteredPaths(undefined)
    }
  }, [setFilteredPaths, paths, queryRegex, props.hiddenPaths])
  return (
    <table className={styles.jsonEditor}>
      <tbody>
        <tr>
          <td>Key</td>
          {props.showType && <td>Type</td>}
          <td>Value</td>
        </tr>
        <JSONField
          filteredPaths={filteredPaths}
          lockedKeys={props.lockedKeys}
          hiddenKeys={props.hiddenKeys}
          isRoot
          name={props.rootName || 'Root'}
          newKeyDefault={props.newKeyDefault}
          newValueDefault={props.newValueDefault}
          onChange={(value: any) => props.onChange?.(value)}
          path=""
          showType={props.showType}
          styles={styles}
          typeBackgrounds={props.typeBackgrounds}
          typeColors={props.typeColors}
          value={createCopy(props.value)}
          nameForItemInList={props.nameForItemInList}
          valueForObject={props.valueForObject}
          valueForArray={props.valueForArray}
          renderButton={({ type, disabled, onClick }) => {
            if (props.renderButton)
              return props.renderButton({ type, disabled, onClick })
            return (
              <button
                tabIndex={-1}
                className={styles.actionButton}
                disabled={disabled}
                onClick={onClick}
              >
                {type === 'delete' ? '–' : '+'}
              </button>
            )
          }}
        />
      </tbody>
    </table>
  )
})

export default JSONEditor
