/* global describe, it */

import {
  Block,
  Assignment,
  Application,
  BinaryOp,
  If,
  Lambda,
  Num,
  Variable
} from '../../src/js/lcl/ast';

import * as assert from 'assert';

import { variableLifter } from '../../src/js/lcl/compiler';

describe('Compiler', function() {
  it('variable lifter finds simple free variables', function() {
    const initialAst = Block([
      Assignment('foo', Lambda(['a'], BinaryOp('*', Variable('a'), Num(2)))),
      Assignment(
        'bar',
        Lambda(['a'], BinaryOp('*', Variable('a'), Variable('time')))
      )
    ]);

    const expected = Block([
      Assignment(
        'foo',
        Lambda(['a'], BinaryOp('*', Variable('a'), Num(2)), false, [])
      ),
      Assignment(
        'bar',
        Lambda(['a'], BinaryOp('*', Variable('a'), Variable('time')), false, [
          'time'
        ])
      )
    ]);

    const transformed = variableLifter(initialAst);

    assert.deepEqual(transformed, expected);
  });

  it('variable lifter finds complex free variables', function() {
    const initialAst = Block([
      Assignment(
        'foo',
        Lambda(
          ['a'],
          Block([
            Assignment(
              'bar',
              Lambda(['b'], BinaryOp('*', Variable('b'), Variable('time')))
            ),
            Application('bar', [Variable('a')])
          ])
        )
      )
    ]);

    const expected = Block([
      Assignment(
        'foo',
        Lambda(
          ['a'],
          Block([
            Assignment(
              'bar',
              Lambda(
                ['b'],
                BinaryOp('*', Variable('b'), Variable('time')),
                false,
                ['time']
              )
            ),
            Application('bar', [Variable('a')])
          ]),
          false,
          ['time']
        )
      )
    ]);

    const transformed = variableLifter(initialAst);

    assert.deepEqual(transformed, expected);
  });

  it('variable lifter finds more complex free variables', function() {
    const initialAst = Block([
      Assignment('baz', Num(4)),
      Assignment(
        'foo',
        Lambda(
          ['a'],
          Block([
            Assignment(
              'bar',
              Lambda(['b'], BinaryOp('*', Variable('b'), Variable('time')))
            ),
            If(
              Num(1),
              Block([
                Application('bar', [BinaryOp('+', Variable('baz'), Num(2))])
              ])
            )
          ])
        )
      )
    ]);

    const expected = Block([
      Assignment('baz', Num(4)),
      Assignment(
        'foo',
        Lambda(
          ['a'],
          Block([
            Assignment(
              'bar',
              Lambda(
                ['b'],
                BinaryOp('*', Variable('b'), Variable('time')),
                false,
                ['time']
              )
            ),
            If(
              Num(1),
              Block([
                Application('bar', [BinaryOp('+', Variable('baz'), Num(2))])
              ])
            )
          ]),
          false,
          ['time', 'baz']
        )
      )
    ]);

    const transformed = variableLifter(initialAst);

    assert.deepEqual(transformed, expected);
  });
});
