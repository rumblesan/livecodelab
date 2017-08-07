import {
  Null,
  Block,
  Assignment,
  Application,
  If,
  Closure,
  Times,
  DoOnce,
  UnaryOp,
  BinaryOp,
  DeIndex,
  Num,
  Variable,
  Str,
  List
} from './index';

import {
  NULL,
  BLOCK,
  ASSIGNMENT,
  APPLICATION,
  IF,
  CLOSURE,
  TIMES,
  DOONCE,
  UNARYOP,
  BINARYOP,
  DEINDEX,
  NUM,
  VARIABLE,
  STRING,
  LIST
} from './types';

export const defaultTraverseFunctions = {
  [NULL]: () => {
    return Null();
  },
  [BLOCK]: (ast, transFuncs, state) => {
    return Block(ast.elements.map(a => astTraverse(a, transFuncs, state)));
  },
  [ASSIGNMENT]: (ast, transFuncs, state) => {
    return Assignment(
      ast.identifier,
      astTraverse(ast.expression, transFuncs, state)
    );
  },
  [APPLICATION]: (ast, transFuncs, state) => {
    return Application(
      ast.identifier,
      ast.args.map(a => astTraverse(a, transFuncs, state)),
      astTraverse(ast.block, transFuncs, state),
      astTraverse(ast.cache, transFuncs, state)
    );
  },
  [IF]: (ast, transFuncs, state) => {
    return If(
      astTraverse(ast.predicate, transFuncs, state),
      astTraverse(ast.ifBlock, transFuncs, state),
      astTraverse(ast.elseBlock, transFuncs, state)
    );
  },
  [CLOSURE]: (ast, transFuncs, state) => {
    return Closure(
      ast.argNames.slice(),
      astTraverse(ast.body, transFuncs, state),
      ast.inlinable
    );
  },
  [TIMES]: (ast, transFuncs, state) => {
    return Times(
      astTraverse(ast.number, transFuncs, state),
      astTraverse(ast.block, transFuncs, state),
      ast.loopVar
    );
  },
  [DOONCE]: (ast, transFuncs, state) => {
    return DoOnce(ast.active, astTraverse(ast.body, transFuncs, state));
  },
  [UNARYOP]: (ast, transFuncs, state) => {
    return UnaryOp(ast.operator, astTraverse(ast.expr1, transFuncs, state));
  },
  [BINARYOP]: (ast, transFuncs, state) => {
    return BinaryOp(
      ast.operator,
      astTraverse(ast.expr1, transFuncs, state),
      astTraverse(ast.expr2, transFuncs, state)
    );
  },
  [LIST]: (ast, transFuncs, state) => {
    return List(ast.values.map(as => astTraverse(as, transFuncs, state)));
  },
  [NUM]: ast => {
    return Num(ast.value);
  },
  [VARIABLE]: ast => {
    return Variable(ast.identifier);
  },
  [STRING]: ast => {
    return Str(ast.value);
  },
  [DEINDEX]: (ast, transFuncs, state) => {
    return DeIndex(
      ast.collection.map(as => astTraverse(as, transFuncs, state)),
      astTraverse(ast.index, transFuncs, state)
    );
  },
  // Number, String, Variable
  default: ast => {
    throw new Error(`Unknown AST type ${ast.type}`);
  }
};

export const astTraverse = (ast, transFuncs, state) => {
  if (transFuncs[ast.type]) return transFuncs[ast.type](ast, transFuncs, state);
  if (transFuncs['default'])
    return transFuncs['default'](ast, transFuncs, state);
  return ast;
};

export const astTransform = (ast, transformations = {}, state = {}) => {
  const transMap = Object.assign({}, defaultTraverseFunctions, transformations);
  return astTraverse(ast, transMap, state);
};
