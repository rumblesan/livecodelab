import { astTransform, isNull, notNull } from './ast/helpers';

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
  Null
} from './ast';

import { createChildScope } from './interpreter-funcs';

export const astCopy = ast => astTransform(ast);

export const functionInliner = (ast, state = {}) => {
  return astTransform(
    ast,
    {
      BLOCK: ast => {
        const childFunctionScope = createChildScope(state);
        return Block(
          ast.elements.map(el => functionInliner(el, childFunctionScope))
        );
      },
      ASSIGNMENT: ast => {
        const expr = functionInliner(ast.expression, state);
        if (expr.ast === 'LAMBDA') {
          state[ast.identifier] = expr;
          return Null();
        }
        return Assignment(ast.identifier, expr);
      },
      APPLICATION: ast => {
        const cache = state[ast.identifier]
          ? astCopy(state[ast.identifier])
          : ast.cache;
        return Application(
          ast.identifier,
          ast.args.map(arg => functionInliner(arg, state)),
          ast.block ? functionInliner(ast.block, state) : ast.block,
          cache
        );
      }
    },
    state
  );
};

export const deadCodeEliminator = ast =>
  astTransform(ast, {
    BLOCK: ast => {
      const elems = ast.elements.map(deadCodeEliminator).filter(notNull);
      if (elems.length <= 0) return Null();
      return Block(elems);
    },
    ASSIGNMENT: ast => {
      const expr = deadCodeEliminator(ast.expression);
      if (isNull(expr)) return Null();
      return Assignment(ast.identifier, expr);
    },
    IF: ast => {
      const newIf = deadCodeEliminator(ast.IfBlock);
      const newElse = deadCodeEliminator(ast.elseBlock);
      if (isNull(newIf) && isNull(newElse)) return Null();
      return If(functionInliner(ast.predicate), newIf, newElse);
    },
    LAMBDA: ast => {
      const body = deadCodeEliminator(ast.body);
      if (isNull(body)) return Null();
      return Lambda(ast.argNames, body, ast.inlinable);
    },
    TIMES: ast => {
      const number = deadCodeEliminator(ast.number);
      const block = deadCodeEliminator(ast.block);
      if (isNull(number) || isNull(block)) return Null();
      return Times(number, block, ast.loopVar);
    },
    DOONCE: ast => {
      if (!ast.active) return Null();
      const body = deadCodeEliminator(ast.body);
      if (isNull(body)) return Null();
      return DoOnce(ast.active, body);
    },
    UNARYOP: ast => {
      const expr1 = deadCodeEliminator(ast.expr1);
      if (isNull(expr1)) return Null();
      return UnaryOp(ast.operator, expr1);
    },
    BINARYOP: ast => {
      const expr1 = deadCodeEliminator(ast.expr1);
      const expr2 = deadCodeEliminator(ast.expr2);
      if (isNull(expr1) || isNull(expr2)) return Null();
      return BinaryOp(ast.operator, expr1, expr2);
    },
    LIST: ast => {
      return List(ast.values.map(deadCodeEliminator).filter(notNull));
    },
    COMMENT: () => Null(),
    NUMBER: ast => ast
  });

export const scopeInliner = ast => {
  return ast;
};
