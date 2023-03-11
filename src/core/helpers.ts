export function valueFromPath(data: any, path: string): unknown {
  const [root, ...rest] = path.split('.')
  if (rest.length > 1) {
    return valueFromPath(data[root], rest.join('.'))
  } else {
    return data[root]
  }
}
