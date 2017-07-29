/* global describe, it */

import { Block, Assignment, BinaryOp, Num } from '../../src/js/lcl/ast';

import * as assert from 'assert';

import { astTransform } from '../../src/js/lcl/ast-funcs';

describe('AST Funcs', function() {
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
});
