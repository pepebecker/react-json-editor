# React JSON Editor

> React JSON Editor inspired by Xcode PList Editor

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save pepebecker/react-json-editor
```

## Usage

```tsx
import React, { useState } from 'react'

import JSONEditor from 'react-json-editor'
import 'react-json-editor/dist/index.css'

const Example = () => {
  const [data, setData] = useState({
    name: 'Peter',
    age: 29,
    married: true,
    hobbies: [
      "Swimming",
      "Dancing"
    ]
  })
  return <JSONEditor data={data} onChange={setData} />
}
```

## License

ISC © [pepebecker](https://github.com/pepebecker)
