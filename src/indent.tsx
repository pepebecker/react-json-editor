import React from 'react'

interface Props {
  depth: number
  styles: { [key: string]: string }
  children: any
}

const Indent = (props: Props) => {
  const styles = props.styles || {}
  return Array(props.depth || 0)
    .fill(0)
    .reduce((children) => {
      return <span className={styles.indent}>{children}</span>
    }, props.children)
}

export default Indent
