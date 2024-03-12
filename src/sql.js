import { unionToSQL, multipleToSQL } from './union'

const supportedTypes = ['analyze', 'attach', 'select', 'deallocate', 'delete', 'exec', 'update', 'insert', 'drop', 'rename', 'truncate', 'call', 'desc', 'use', 'alter', 'set', 'create', 'lock', 'unlock', 'declare', 'show', 'replace', 'if', 'grant', 'revoke', 'proc', 'raise', 'execute', 'transaction']

function checkSupported(expr) {
  const ast = expr && expr.ast ? expr.ast : expr
  if (!supportedTypes.includes(ast.type)) throw new Error(`${ast.type} statements not supported at the moment`)
}

function toSQL(ast, renderOptions) {
  if (Array.isArray(ast)) {
    ast.forEach(checkSupported)
    return multipleToSQL(ast, renderOptions)
  }
  checkSupported(ast)
  return unionToSQL(ast, renderOptions)
}

function goToSQL(stmt, renderOptions) {
  if (!stmt || stmt.length === 0) return ''
  const res = [toSQL(stmt.ast)]
  if (stmt.go_next) res.push(stmt.go.toUpperCase(), goToSQL(stmt.go_next, renderOptions))
  return res.filter(sqlItem => sqlItem).join(' ')
}

export default function astToSQL(ast, renderOptions) {
  const sql = ast.go === 'go' ? goToSQL(ast, renderOptions) : toSQL(ast, renderOptions)
  return sql
}
