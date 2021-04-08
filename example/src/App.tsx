import React, { useCallback, useState } from 'react'
import { useDebounce } from 'use-debounce'

import JSONEditor from 'react-json-editor'
import 'react-json-editor/dist/index.css'

const initialData = {
  name: 'James',
  gender: 'male',
  age: 26,
  student: false,
  friends: [
    {
      name: 'Minsu',
      gender: 'female',
      age: 24,
      student: true
    },
    {
      name: 'Mark',
      gender: 'male',
      age: 32,
      student: false
    }
  ]
}

const App = () => {
  const [data, setData] = useState(initialData)
  const [lockedKeys, setLockedKeys] = useState([''])
  const [hiddenKeys, setHiddenKeys] = useState([''])
  const [hiddenPaths, setHiddenPaths] = useState([''])
  const [text, setText] = useState(JSON.stringify(initialData, null, '  '))
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)

  const [typeBackgrounds] = useState({
    string: 'green',
    number: 'tomato',
    boolean: 'orange',
  })
  const [typeColors] = useState({
    string: 'white',
    number: 'white',
    object: 'gray',
    array: 'gray',
  })

  const onChangeData = useCallback(
    (value: any) => {
      setData(value)
      setText(JSON.stringify(value, null, '  '))
    },
    [setData]
  )

  const nameForItemInList = useCallback((i: number) => {
    return `entry ${i + 1}`
  }, [])

  const valueForArray = useCallback((array) => {
    return `(${array.length} entries)`
  }, [])

  const valueForObject = useCallback((object) => {
    return `(${Object.keys(object).length} entries)`
  }, [])

  return (
    <div>
      <input
        className="query-input"
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(ev) => setQuery(ev.target.value)}
      />
      <JSONEditor
        value={data}
        lockedKeys={lockedKeys}
        hiddenKeys={hiddenKeys}
        hiddenPaths={hiddenPaths}
        showType
        onChange={onChangeData}
        query={debouncedQuery}
        rootName="Data"
        typeBackgrounds={typeBackgrounds}
        typeColors={typeColors}
        nameForItemInList={nameForItemInList}
        valueForArray={valueForArray}
        valueForObject={valueForObject}
      />
      <JSONEditor
        value={lockedKeys}
        onChange={setLockedKeys}
        rootName='Locked keys'
        typeBackgrounds={{ string: 'green' }}
        typeColors={{ string: 'white', array: 'gray' }}
        nameForItemInList={(i) => `locked key ${i + 1}`}
        valueForArray={(array) => `(${array.length} locked keys)`}
      />
      <JSONEditor
        value={hiddenKeys}
        onChange={setHiddenKeys}
        rootName='Hidden keys'
        typeBackgrounds={{ string: 'green' }}
        typeColors={{ string: 'white', array: 'gray' }}
        nameForItemInList={(i) => `hidden key ${i + 1}`}
        valueForArray={(array) => `(${array.length} hidden keys)`}
      />
      <JSONEditor
        value={hiddenPaths}
        onChange={setHiddenPaths}
        rootName='Hidden paths'
        typeBackgrounds={{ string: 'green' }}
        typeColors={{ string: 'white', array: 'gray' }}
        nameForItemInList={(i) => `hidden path ${i + 1}`}
        valueForArray={(array) => `(${array.length} hidden paths)`}
      />
      <h3>JSON Editor</h3>
      <textarea
        value={text}
        style={{ width: '100%', height: 500 }}
        onChange={(ev) => {
          setText(ev.target.value || '')
          try {
            let value = JSON.parse(ev.target.value)
            if (value) setData(value)
          } catch (error) {}
        }}
      />
    </div>
  )
}

export default App
