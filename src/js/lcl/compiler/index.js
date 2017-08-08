import {
  Null,
  Block,
  Assignment,
  Application,
  If,
  Lambda,
  Times,
  DoOnce,
  UnaryOp,
  BinaryOp,
  DeIndex,
  Num,
  Variable,
  Str,
  List
} from '../ast';

import {
  NULL,
  BLOCK,
  ASSIGNMENT,
  APPLICATION,
  IF,
  LAMBDA,
  TIMES,
  DOONCE,
  UNARYOP,
  BINARYOP,
  DEINDEX,
  NUMBER,
  VARIABLE,
  STRING,
  LIST
} from '../ast/types';

import { astTransform } from '../ast/func';

export function variableLifter(
  ast,
  initialState = {
    parentScope: {},
    scope: {},
    free: []
  }
) {
  return astTransform(
    ast,
    {
      [VARIABLE]: (variable, transFuncs, state) => {
        if (!state.scope[variable.identifier]) {
          state.free.push(variable.identifier);
        }
        return Variable(variable.identifier);
      },

      [ASSIGNMENT]: (assignment, transFuncs, state) => {
        const expr = variableLifter(assignment.expression, state);
        if (state.parentScope[assignment.identifier]) {
          state.free.push(assignment.identifier);
        } else {
          state.scope[assignment.identifier] = true;
        }
        return Assignment(assignment.identifier, expr);
      },

      [LAMBDA]: (lambda, transFuncs, state) => {
        const newParent = Object.create(state.parentScope);
        Object.assign(newParent, state.scope);
        const newScope = lambda.argNames.reduce((s, name) => {
          s[name] = true;
          return s;
        }, {});

        const newState = { scope: newScope, free: [], parentScope: newParent };
        const newBody = variableLifter(lambda.body, newState);
        const freeVars = newState.free;

        freeVars.forEach(v => {
          if (!state.scope[v]) {
            state.free.push(v);
          }
        });

        return Lambda(lambda.argNames, newBody, lambda.inlinable, freeVars);
      }
    },
    initialState
  );
}
