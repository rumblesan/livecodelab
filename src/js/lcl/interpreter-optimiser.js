export const astCopy = ast => {
  return ast;
};

export const inliner = ast => {
  switch (ast.type) {
    case 'BLOCK':
      elements.map(inliner);
  }
};

export const scopeInliner = ast => {
  return ast;
};
