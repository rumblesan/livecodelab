import {
  Block,
  Assignment,
  Application,
  If,
  Lambda,
  Times,
  DoOnce,
  UnaryOp,
  BinaryOp,
  List,
  DeIndex
} from './index';

export const isNull = ast => ast.ast === 'NULL';
export const notNull = ast => ast.ast !== 'NULL';

const defaultMapFunctions = {
  BLOCK: (ast, func, state, mapFuncs) => {
    return func(
      Block(ast.elements.map(a => astTraverse(a, func, state, mapFuncs))),
      func,
      state,
      mapFuncs
    );
  },
  ASSIGNMENT: (ast, func, state, mapFuncs) => {
    return func(
      Assignment(
        ast.identifier,
        astTraverse(ast.expression, func, state, mapFuncs),
        ast.stackPos
      ),
      func,
      state,
      mapFuncs
    );
  },
  APPLICATION: (ast, func, state, mapFuncs) => {
    return func(
      Application(
        ast.identifier,
        ast.args.map(a => astTraverse(a, func, state, mapFuncs)),
        ast.block ? astTraverse(ast.block, func, state, mapFuncs) : ast.block,
        ast.cache ? astTraverse(ast.cache, func, state, mapFuncs) : ast.cache,
        ast.argStackPositions
      ),
      func,
      state
    );
  },
  IF: (ast, func, state, mapFuncs) => {
    return func(
      If(
        astTraverse(ast.predicate, func, state, mapFuncs),
        astTraverse(ast.ifBlock, func, state, mapFuncs),
        astTraverse(ast.elseBlock, func, state, mapFuncs)
      ),
      func,
      state
    );
  },
  LAMBDA: (ast, func, state, mapFuncs) => {
    return func(
      Lambda(
        ast.argNames.slice(),
        astTraverse(ast.body, func, state, mapFuncs),
        ast.inlinable
      ),
      func,
      state
    );
  },
  TIMES: (ast, func, state, mapFuncs) => {
    return func(
      Times(
        astTraverse(ast.number, func, state, mapFuncs),
        astTraverse(ast.block, func, state, mapFuncs),
        ast.loopVar
      ),
      astTraverse,
      mapFuncs,
      state
    );
  },
  DOONCE: (ast, func, state, mapFuncs) => {
    return func(
      DoOnce(ast.active, astTraverse(ast.body, func, state, mapFuncs)),
      func,
      state
    );
  },
  UNARYOP: (ast, func, state, mapFuncs) => {
    return func(
      UnaryOp(ast.operator, astTraverse(ast.expr1, func, state, mapFuncs)),
      func,
      state
    );
  },
  BINARYOP: (ast, func, state, mapFuncs) => {
    return func(
      BinaryOp(
        ast.operator,
        astTraverse(ast.expr1, func, state, mapFuncs),
        astTraverse(ast.expr2, func, state, mapFuncs)
      ),
      func,
      state
    );
  },
  LIST: (ast, func, state, mapFuncs) => {
    return func(
      List(ast.values.map(as => astTraverse(as, func, state, mapFuncs))),
      func,
      state
    );
  },
  DEINDEX: (ast, func, state, mapFuncs) => {
    return func(
      DeIndex(
        ast.collection.map(as => astTraverse(as, func, state, mapFuncs)),
        astTraverse(ast.index, func, state, mapFuncs)
      ),
      func,
      state
    );
  },
  // Number, String, Variable, Comment
  default: (ast, func, state, mapFuncs) => func(ast, func, state, mapFuncs)
};

export const astTraverse = (ast, func, state, mapFuncs) => {
  if (mapFuncs[ast.ast]) return mapFuncs[ast.ast](ast, func, state, mapFuncs);
  if (mapFuncs['default'])
    return mapFuncs['default'](ast, func, state, mapFuncs);
  return func(ast);
};

export const astMap = (ast, func) => {
  const transMap = Object.assign({}, defaultMapFunctions);
  return astTraverse(ast, func, {}, transMap);
};

export const astTransform = (ast, transformations = {}, state = {}) => {
  const transMap = Object.assign({}, defaultMapFunctions, transformations);
  return astTraverse(ast, a => a, state, transMap);
};
