import { exprToSQL, getExprListSQL, orderOrPartitionByToSQL, varToSQL } from './expr'
import { columnRefToSQL, columnsToSQL } from './column'
import { limitToSQL } from './limit'
import { withToSQL } from './with'
import { tablesToSQL } from './tables'
import { hasVal, filterResult, commonOptionConnector, connector, identifierToSql, topToSQL, toUpper } from './util'
import { whitespace } from './whitespace'

function distinctToSQL(distinct, renderOptions) {
  if (!distinct) return
  if (typeof distinct === 'string') return distinct
  const { type, columns } = distinct
  const wspc = (renderOptions && renderOptions.preserveWhitespace) ? (distinct.wspc ?? {}) : {}
  const result = [toUpper(type)]
  if (columns) result.push(`(${columns.map(columnRefToSQL).join(', ')})`)
  result.push(whitespace(wspc.after, ''))
  return filterResult(result).join(' ')
}

function selectIntoToSQL(into) {
  if (!into) return
  const { position } = into
  if (!position) return
  const { keyword, expr } = into
  const result = []
  const intoType = toUpper(keyword)
  switch (intoType) {
    case 'VAR':
      result.push(expr.map(varToSQL).join(', '))
      break
    default:
      result.push(intoType, typeof expr === 'string' ? identifierToSql(expr) : exprToSQL(expr))
  }
  return result.filter(hasVal).join(' ')
}
/**
 * @param {Object}      stmt
 * @param {?Array}      stmt.with
 * @param {?Array}      stmt.options
 * @param {?string}     stmt.distinct
 * @param {?Array|string}   stmt.columns
 * @param {?Array}      stmt.from
 * @param {?Object}     stmt.where
 * @param {?Array}      stmt.groupby
 * @param {?Object}     stmt.having
 * @param {?Array}      stmt.orderby
 * @param {?Array}      stmt.limit
 * @return {string}
 */

function forXmlToSQL(stmt) {
  if (!stmt) return
  const { expr, keyword, type } = stmt
  const result = [toUpper(type), toUpper(keyword)]
  if (!expr) return result.join(' ')
  return `${result.join(' ')}(${exprToSQL(expr)})`
}

// eslint-disable-next-line max-statements, complexity
function selectToSQL(stmt, renderOptions) {
  const {
    as_struct_val: asStructVal,
    columns,
    distinct,
    for: forXml,
    from,
    for_sys_time_as_of: forSystem = {},
    locking_read: lockingRead,
    groupby,
    having,
    into = {},
    limit,
    options,
    orderby,
    parentheses_symbol: parentheses,
    qualify,
    top,
    window: windowInfo,
    with: withInfo,
    where,
  } = stmt
  const wspc = (renderOptions && renderOptions.preserveWhitespace) ? (stmt.wspc ?? {}) : {}
  const clauses = []
  clauses.push(withToSQL({
    content : withInfo,
    ...(wspc ? { before: wspc.beforeWithClause, after: wspc.afterWithClause } : {}),
  }, renderOptions))
  clauses.push('SELECT')
  clauses.push(whitespace(wspc.afterSelect, ' '))
  clauses.push(toUpper(asStructVal, renderOptions))
  clauses.push(whitespace(wspc.afterAsStructVal, asStructVal ? ' ' : ''))
  clauses.push(topToSQL(top, renderOptions))
  clauses.push(whitespace(wspc.afterTop, top ? ' ' : ''))
  if (Array.isArray(options)) clauses.push(options.join(' '))
  clauses.push(whitespace(wspc.afterOptionClause, Array.isArray(options) ? ' ' : ''))
  clauses.push(distinctToSQL(distinct, renderOptions))
  clauses.push(columnsToSQL(columns, from))
  clauses.push(whitespace(wspc.afterColumnClause, columns ? ' ' : ''))
  const { position } = into
  let intoSQL = ''
  if (position) intoSQL = commonOptionConnector('INTO', selectIntoToSQL, into)
  if (position === 'column') {
    clauses.push(intoSQL)
    clauses.push(whitespace(wspc.afterColumnIntoClause, into ? ' ' : ''))
  }
  // FROM + joins
  clauses.push(commonOptionConnector('FROM', tablesToSQL, from))
  clauses.push(whitespace(wspc.afterFromClause, from ? ' ' : ''))
  if (position === 'from') {
    clauses.push(intoSQL)
    clauses.push(whitespace(wspc.afterFromIntoClause, into ? ' ' : ''))
  }
  const { keyword, expr } = forSystem || {}
  clauses.push(commonOptionConnector(keyword, exprToSQL, expr))
  clauses.push(commonOptionConnector('WHERE', exprToSQL, where))
  clauses.push(whitespace(wspc.afterWhereClause, where ? ' ' : ''))
  clauses.push(connector('GROUP BY', getExprListSQL(groupby).join(', ')))
  clauses.push(whitespace(wspc.afterGroupByClause, groupby ? ' ' : ''))
  clauses.push(commonOptionConnector('HAVING', exprToSQL, having))
  clauses.push(whitespace(wspc.afterHavingClause, having ? ' ' : ''))
  clauses.push(commonOptionConnector('QUALIFY', exprToSQL, qualify))
  clauses.push(whitespace(wspc.afterQualifyClause, qualify ? ' ' : ''))
  clauses.push(commonOptionConnector('WINDOW', exprToSQL, windowInfo))
  clauses.push(whitespace(wspc.afterWindowClause, windowInfo ? ' ' : ''))
  clauses.push(orderOrPartitionByToSQL(orderby, 'order by'))
  clauses.push(whitespace(wspc.afterOrderByClause, orderby ? ' ' : ''))
  clauses.push(limitToSQL(limit, renderOptions))
  clauses.push(toUpper(lockingRead))
  clauses.push(whitespace(wspc.afterLockingRead, lockingRead ? ' ' : ''))
  if (position === 'end') {
    clauses.push(intoSQL)
    clauses.push(whitespace(wspc.afterEndIntoClause, into ? ' ' : ''))
  }
  clauses.push(forXmlToSQL(forXml, renderOptions))
  clauses.push(whitespace(wspc.afterForXmlClause, forXml ? ' ' : ''))
  const sql = filterResult(clauses).join('')
  return parentheses ? `(${sql})` : sql
}

export {
  selectIntoToSQL,
  selectToSQL,
}
