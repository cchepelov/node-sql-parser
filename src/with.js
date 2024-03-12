import { columnRefToSQL } from './column'
import { exprToSQL } from './expr'
import { filterResult, identifierToSql, literalToSQL } from './util'
import { whitespace } from './whitespace'

/**
 *
 * note on the space after WITH: could preserve whitespace here too
 */
function withToSQL(withExpr, renderOptions) {
  if (!withExpr || !withExpr.content || withExpr.content.length === 0) return
  const result = []
  const wspc = (renderOptions && renderOptions.preserveWhitespace) ? (withExpr.wspc ?? {}) : {}
  result.push(whitespace(wspc.before, ''))
  result.push('WITH ')
  result.push(withExpr.content[0].recursive ? 'RECURSIVE ' : '')

  const withExprElements = withExpr.content.map(cte => {
    const { name, stmt, columns } = cte
    const column = Array.isArray(columns) ? `(${columns.map(columnRefToSQL).join(', ')})` : ''
    return `${name.type === 'default' ? identifierToSql(name.value) : literalToSQL(name)}${column} AS (${exprToSQL(stmt)})`
  })
  withExprElements.forEach((elt, idx) => {
    if (idx > 0) {
      result.push(', ')
    }
    result.push(elt)
  })
  return filterResult(result).join('') + whitespace(wspc.after, ' ')
}

export {
  withToSQL,
}
