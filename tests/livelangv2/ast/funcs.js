/* global describe, it */

import { Block, Assignment, BinaryOp, Num } from '../../../src/js/lcl/ast';
import { NUM } from '../../../src/js/lcl/ast/types';

import * as assert from 'assert';

import {
  astTraverse,
  astTransform,
  defaultTraverseFunctions
} from '../../../src/js/lcl/ast/func';

describe('AST Funcs', function() {
  it('astTraverse runs fine', function() {
    const initialAst = Block([
      Assignment('foo', Num(4)),
      Assignment('bar', BinaryOp('*', Num(2), Num(3)))
    ]);

    astTraverse(initialAst, defaultTraverseFunctions, {});
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
      [NUM]: ast => Num(ast.value * 2)
    });

    assert.deepEqual(transformed, expected);
  });
});
