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

export const mapMaybe = (ast, func) => {
  if (ast) {
    return astMap(ast, func);
  }
  return ast;
};

export const isNull = ast => ast.ast === 'NULL';
export const notNull = ast => ast.ast !== 'NULL';

export const astMap = (ast, func) => {
  switch (ast.ast) {
    case 'BLOCK':
      return func(Block(ast.elements.map(a => astMap(a, func))));
    case 'ASSIGNMENT':
      return func(Assignment(ast.identifier, astMap(ast.expression, func)));
    case 'APPLICATION':
      return func(
        Application(
          ast.identifier,
          ast.args.map(a => astMap(a, func)),
          mapMaybe(ast.block, func),
          mapMaybe(ast.cache, func)
        )
      );
    case 'IF':
      return func(
        If(
          astMap(ast.predicate, func),
          astMap(ast.ifBlock, func),
          mapMaybe(ast.elseBlock, func)
        )
      );
    case 'LAMBDA':
      return func(
        Lambda(ast.argNames.slice(), astMap(ast.body, func), ast.inlinable)
      );
    case 'TIMES':
      return func(
        Times(astMap(ast.number, func), astMap(ast.block, func), ast.loopVar)
      );
    case 'DOONCE':
      return func(DoOnce(ast.active, astMap(ast.body, func)));
    case 'UNARYOP':
      return func(UnaryOp(ast.operator, astMap(ast.expr1, func)));
    case 'BINARYOP':
      return func(
        BinaryOp(ast.operator, astMap(ast.expr1, func), astMap(ast.expr2, func))
      );
    case 'LIST':
      return func(List(ast.values.map(as => astMap(as, func))));
    case 'DEINDEX':
      return func(
        DeIndex(
          ast.collection.map(as => astMap(as, func)),
          astMap(ast.index, func)
        )
      );
    default:
      // Number, String, Variable, Comment
      return func(ast);
  }
};

export const astTransform = (ast, transMap = {}, state = {}) => {
  const f = node => {
    if (transMap[node.ast]) return transMap[node.ast](node, transMap, state);
    if (transMap['default']) return transMap['default'](node, transMap, state);
    return node;
  };
  return astMap(ast, f);
};
