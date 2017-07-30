/* global describe, it */

import { Block, Assignment, BinaryOp, Num } from '../../../src/js/lcl/ast';

import * as assert from 'assert';

import { astTransform, astMap } from '../../../src/js/lcl/ast/helpers';

describe('AST Funcs', function() {
  it('maps a function over an ast correctly', function() {
    const initialAst = Block([
      Assignment('foo', Num(4)),
      Assignment('bar', BinaryOp('*', Num(2), Num(3)))
    ]);

    astMap(initialAst, ast => {
      return ast;
    });
  });

  it('trans runs fine', function() {
    const initialAst = Block([
      Assignment('foo', Num(4)),
      Assignment('bar', BinaryOp('*', Num(2), Num(3)))
    ]);

    astTransform(initialAst);
  });

  it('simple transform', function() {
    const initialAst = Block([
      Assignment('foo', Num(4)),
      Assignment('bar', BinaryOp('*', Num(2), Num(3)))
    ]);

    const expected = Block([
      Assignment('foo', Num(8)),
      Assignment('bar', BinaryOp('*', Num(4), Num(6)))
    ]);

    const transformed = astTransform(initialAst, {
      NUMBER: ast => Num(ast.value * 2)
    });

    assert.deepEqual(transformed, expected);
  });

  it('transform with default', function() {
    const initialAst = Block([
      Assignment('foo', Num(4)),
      Assignment('bar', BinaryOp('*', Num(2), Num(3)))
    ]);

    const expected = Block([
      Assignment('foo', Num(8)),
      Assignment('bar', BinaryOp('*', Num(4), Num(6)))
    ]);

    const transformed = astTransform(initialAst, {
      NUMBER: ast => Num(ast.value * 2),
      default: ast => {
        return ast;
      }
    });

    assert.deepEqual(transformed, expected);
  });
});
