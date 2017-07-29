/* global describe, it */

import { parse } from '../../src/grammar/lcl';

import {
  Block,
  Assignment,
  Application,
  BinaryOp,
  Num,
  Times,
  Variable,
  Lambda,
  Null
} from '../../src/js/lcl/ast';

import { dedent } from 'dentist';

import * as assert from 'assert';

import {
  astCopy,
  functionInliner,
  deadCodeEliminator
} from '../../src/js/lcl/interpreter-optimiser';

describe('Optimiser', function() {
  it('copying ast', function() {
    const initialAst = Block([
      Assignment('foo', Lambda(['a'], BinaryOp('*', Num(255), Variable('a')))),
      Assignment(
        'bar',
        Lambda(
          ['b'],
          BinaryOp('*', Variable('b'), Application('foo', [Num(7)], null))
        )
      ),
      Assignment('baz', Application('bar', [Num(1)], null))
    ]);

    const copiedAst = astCopy(initialAst);

    assert.deepEqual(initialAst, copiedAst);
  });

  it('test simple inline', function() {
    const program = dedent(`
                            foo = (a) => a
                            bar = (b) => foo b
                            bar 1
                           `);

    const parsed = parse(program);
    const inlinedAst = functionInliner(parsed, {});

    const initialAst = Block([
      Assignment('foo', Lambda(['a'], Variable('a'))),
      Assignment(
        'bar',
        Lambda(['b'], Application('foo', [Variable('b')], null))
      ),
      Application('bar', [Num(1)], null)
    ]);

    const expectedInlined = Block([
      Null(),
      Null(),
      Application(
        'bar',
        [Num(1)],
        null,
        Lambda(
          ['b'],
          Application(
            'foo',
            [Variable('b')],
            null,
            Lambda(['a'], Variable('a'))
          )
        )
      )
    ]);

    assert.deepEqual(parsed, initialAst);
    assert.deepEqual(inlinedAst, expectedInlined);
  });

  it('test simple optimisation', function() {
    const initialAst = Num(2);

    const inlinedAst = deadCodeEliminator(initialAst);
    const expectedInlined = Num(2);

    assert.deepEqual(inlinedAst, expectedInlined);
  });

  it('test optimisation', function() {
    const program = dedent(`
                           foo = (a) => 255 * a
                           bar = (b) => b * foo 7
                           baz = bar 1
                           bin = foo 2
                           `);
    const parsed = parse(program);
    const initialAst = Block([
      Assignment('foo', Lambda(['a'], BinaryOp('*', Num(255), Variable('a')))),
      Assignment(
        'bar',
        Lambda(
          ['b'],
          BinaryOp('*', Variable('b'), Application('foo', [Num(7)], null))
        )
      ),
      Assignment('baz', Application('bar', [Num(1)], null)),
      Assignment('bin', Application('foo', [Num(2)], null))
    ]);

    const inlinedAst = deadCodeEliminator(functionInliner(parsed, {}));
    const expectedInlined = Block([
      Assignment(
        'baz',
        Application(
          'bar',
          [Num(1)],
          null,
          Lambda(
            ['b'],
            BinaryOp(
              '*',
              Variable('b'),
              Application(
                'foo',
                [Num(7)],
                null,
                Lambda(['a'], BinaryOp('*', Num(255), Variable('a')))
              )
            )
          )
        )
      ),
      Assignment(
        'bin',
        Application(
          'foo',
          [Num(2)],
          null,
          Lambda(['a'], BinaryOp('*', Num(255), Variable('a')))
        )
      )
    ]);

    assert.deepEqual(parsed, initialAst);
    assert.deepEqual(inlinedAst, expectedInlined);
  });

  it('optimise loop', function() {
    const program = dedent(`
                           foo = (a) => 255 * a
                           10 times
                           \tfoo 1
                           `);
    const parsed = parse(program);
    const initialAst = Block([
      Assignment('foo', Lambda(['a'], BinaryOp('*', Num(255), Variable('a')))),
      Times(Num(10), Block([Application('foo', [Num(1)], null)]), null)
    ]);

    const inlinedAst = deadCodeEliminator(functionInliner(parsed, {}));
    const expectedInlined = Block([
      Times(
        Num(10),
        Block([
          Application(
            'foo',
            [Num(1)],
            null,
            Lambda(['a'], BinaryOp('*', Num(255), Variable('a')))
          )
        ]),
        null
      )
    ]);

    assert.deepEqual(parsed, initialAst);
    assert.deepEqual(inlinedAst, expectedInlined);
  });
});
