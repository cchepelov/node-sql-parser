function whitespace(wspc, replacement) {
  if (!wspc || !Array.isArray(wspc) || wspc.length === 0) {
    return replacement
  }

  const res = []
  for (const elt of wspc) {
    if (typeof elt === 'string') {
      res.push(elt)
    } else if (Array.isArray(elt)) {
      for (const subElt of elt) {
        if (typeof subElt === 'string') {
          res.push(subElt)
        } else if (Array.isArray(subElt)) {
          for (const sse of subElt) {
            // eslint-disable-next-line max-depth
            if (typeof sse === 'string') {
              res.push(sse)
              // eslint-disable-next-line no-magic-numbers
            } else if (Array.isArray(sse) && sse.length === 3 && (!sse[0]) && (!sse[1])) {
              res.push(sse[2])
            }
          }
        }
      }
    }
  }
  return res.join('')
}

export {
  whitespace,
}
