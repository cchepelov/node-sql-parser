import { connector, toUpper, hasVal } from './util'
import { exprToSQL } from './expr'
import { whitespace } from './whitespace'

function composePrefixValSuffix(stmt) {
  if (!stmt) return []
  return [toUpper(stmt.prefix), exprToSQL(stmt.value), toUpper(stmt.suffix)]
}

function fetchOffsetToSQL(stmt, renderOptions) {
  const { fetch, offset } = stmt
  const wspc = (renderOptions && renderOptions.preserveWhitespace) ? (stmt.wspc ?? {}) : {}

  const result = [
    ...composePrefixValSuffix(offset),
    ...composePrefixValSuffix(fetch),
    whitespace(wspc.after, ''),
  ]
  return result.filter(hasVal).join(' ')
}

function limitOffsetToSQL(limit) {
  const { seperator, value } = limit
  if (value.length === 1 && seperator === 'offset') return connector('OFFSET', exprToSQL(value[0]))
  return connector('LIMIT', value.map(exprToSQL).join(`${seperator === 'offset' ? ' ' : ''}${toUpper(seperator)} `))
}

function limitToSQL(limit, renderOptions) {
  if (!limit) return ''
  if (limit.fetch) {
    return fetchOffsetToSQL(limit, renderOptions)
  }
  return limitOffsetToSQL(limit, renderOptions)
}

export {
  limitToSQL,
}
