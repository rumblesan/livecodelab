import { astMap, astTransform, isNull, notNull } from './ast/helpers';

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
  Variable,
  Null
} from './ast';

import { createChildScope } from './interpreter-funcs';

export const astCopy = ast => astMap(ast, a => a);

export const functionCacher = (ast, initialState = {}) => {
  return astTransform(
    ast,
    {
      BLOCK: (ast, func, state) => {
        const childFunctionScope = createChildScope(state);
        return Block(
          ast.elements.map(el => {
            return functionCacher(el, childFunctionScope);
          })
        );
      },
      ASSIGNMENT: (ast, func, state) => {
        const expr = functionCacher(ast.expression, state);
        if (expr.ast === 'LAMBDA') {
          state[ast.identifier] = expr;
          return Null();
        }
        return Assignment(ast.identifier, expr);
      },
      APPLICATION: (ast, func, state) => {
        const cache = state[ast.identifier]
          ? astCopy(state[ast.identifier])
          : ast.cache;
        return Application(
          ast.identifier,
          ast.args.map(arg => functionCacher(arg, state)),
          ast.block ? functionCacher(ast.block, state) : ast.block,
          cache
        );
      }
    },
    initialState
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
      return If(functionCacher(ast.predicate), newIf, newElse);
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

export const argFlattener = (
  ast,
  initialState = {
    variables: [],
    lookup: {}
  }
) =>
  astTransform(
    ast,
    {
      VARIABLE: (ast, func, state) => {
        const stackPos = state.lookup[ast.identifier];
        return Variable(ast.identifier, stackPos);
      },
      ASSIGNMENT: (ast, func, state) => {
        const expr = argFlattener(ast.expression, state);
        let stackPos = state.lookup[ast.identifier];
        // if there isn't a value already defined for this variable
        // then create a new entry
        if (!stackPos) {
          // subtract 1 because we want the position of the element
          stackPos = state.variables.push(ast.identifier) - 1;
          state.lookup[ast.identifier] = stackPos;
        }
        return Assignment(ast.identifier, expr, stackPos);
      },
      APPLICATION: (ast, func, state) => {
        // Assuming functions have already been flattened and cached
        const argStackPositions = ast.cache.argNames.map(name => {
          let stackPos = state.lookup[name];
          if (!stackPos) {
            // subtract 1 because we want the position of the element
            stackPos = state.variables.push(name) - 1;
            state.lookup[name] = stackPos;
          }
          return stackPos;
        });
        return Application(
          ast.identifier,
          ast.args.map(arg => argFlattener(arg, state)),
          ast.block ? argFlattener(ast.block, state) : ast.block,
          argFlattener(ast.cache, state),
          argStackPositions
        );
      }
    },
    initialState
  );

export const localVariableOptimiser = (
  ast,
  initialState = {
    variables: [],
    lookup: {}
  }
) =>
  astTransform(
    ast,
    {
      VARIABLE: (ast, func, localScope) => {
        const offset = localScope.lookup[ast.identifier];
        if (offset !== undefined && offset !== null) {
          return Variable(ast.identifier, offset, true);
        }
        return Variable(ast.identifier, ast.stackPos, ast.local);
      },
      ASSIGNMENT: (ast, func, localScope) => {
        const expr = localVariableOptimiser(ast.expression, localScope);
        let offset = localScope.lookup[ast.identifier];
        // if there isn't a value already defined for this variable
        // then create a new entry
        if (!offset) {
          // subtract 1 because we want the position of the element
          offset = localScope.variables.push(ast.identifier) - 1;
          localScope.lookup[ast.identifier] = offset;
          return Assignment(ast.identifier, expr, offset, true);
        }
        return Assignment(ast.identifier, ast.expr, offset, ast.local);
      },
      LAMBDA: ast => {
        // Assuming functions have already been flattened and cached
        const localScope = {
          variables: [],
          lookup: {}
        };
        ast.argNames.forEach(name => {
          // subtract 1 because we want the position of the element
          let offset = localScope.variables.push(name) - 1;
          localScope.lookup[name] = offset;
        });

        const body = localVariableOptimiser(ast.body, localScope);
        return Lambda(ast.argNames.slice(), body, ast.inlinable);
      }
    },
    initialState
  );
