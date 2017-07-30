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
  functionCacher,
  deadCodeEliminator,
  argFlattener
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
    const inlinedAst = functionCacher(parsed, {});

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

    const inlinedAst = deadCodeEliminator(functionCacher(parsed, {}));
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

    const inlinedAst = deadCodeEliminator(functionCacher(parsed, {}));
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

  it('basic arg flattening', function() {
    const program = dedent(`
                           foo = (a) => 255 * a
                           foo 1
                           `);
    const parsed = parse(program);
    const initialAst = Block([
      Assignment('foo', Lambda(['a'], BinaryOp('*', Num(255), Variable('a')))),
      Application('foo', [Num(1)], null)
    ]);

    assert.deepEqual(parsed, initialAst);

    const inlinedAst = deadCodeEliminator(functionCacher(parsed, {}));
    const expectedInlined = Block([
      Application(
        'foo',
        [Num(1)],
        null,
        Lambda(['a'], BinaryOp('*', Num(255), Variable('a')))
      )
    ]);

    assert.deepEqual(inlinedAst, expectedInlined);

    const argFlattenedAst = argFlattener(inlinedAst);
    const expectedArgFlattened = Block([
      Application(
        'foo',
        [Num(1)],
        null,
        Lambda(['a'], BinaryOp('*', Num(255), Variable('a', 0))),
        [0]
      )
    ]);

    assert.deepEqual(argFlattenedAst, expectedArgFlattened);
  });

  it('complex arg flattening', function() {
    const program = dedent(`
                           d = 7
                           foo = (a, b) => b * a
                           bar = (x) => foo x, 3
                           bar d
                           `);
    const parsed = parse(program);
    const initialAst = Block([
      Assignment('d', Num(7)),
      Assignment(
        'foo',
        Lambda(['a', 'b'], BinaryOp('*', Variable('b'), Variable('a')))
      ),
      Assignment(
        'bar',
        Lambda(['x'], Application('foo', [Variable('x'), Num(3)]))
      ),
      Application('bar', [Variable('d')])
    ]);

    const cached = functionCacher(parsed, {});
    const inlinedAst = deadCodeEliminator(cached);
    const expectedInlined = Block([
      Assignment('d', Num(7)),
      Application(
        'bar',
        [Variable('d')],
        null,
        Lambda(
          ['x'],
          Application(
            'foo',
            [Variable('x'), Num(3)],
            null,
            Lambda(['a', 'b'], BinaryOp('*', Variable('b'), Variable('a')))
          )
        )
      )
    ]);

    const argFlattenedAst = argFlattener(inlinedAst);
    // d: 0, x: 1, a: 2, b: 3
    const expectedArgFlattened = Block([
      Assignment('d', Num(7), 0),
      Application(
        'bar',
        [Variable('d', 0)],
        null,
        Lambda(
          ['x'],
          Application(
            'foo',
            [Variable('x', 1), Num(3)],
            null,
            Lambda(
              ['a', 'b'],
              BinaryOp('*', Variable('b', 3), Variable('a', 2))
            ),
            [2, 3]
          )
        ),
        [1]
      )
    ]);

    assert.deepEqual(parsed, initialAst);
    assert.deepEqual(inlinedAst, expectedInlined);
    assert.deepEqual(argFlattenedAst, expectedArgFlattened);
  });

  it('complex arg flattening with prior values', function() {
    const program = dedent(`
                           foo = (a, b) => b * a
                           d = pi
                           bar = (x) => foo x, time
                           bar d
                           `);
    const flattenerState = {
      variables: ['time', 'pi'],
      lookup: { time: 0, pi: 1 }
    };
    const argFlattenedAst = argFlattener(
      deadCodeEliminator(functionCacher(parse(program), {})),
      flattenerState
    );
    // time: 0, pi: 1, d: 2, x: 3, a: 4, b: 5
    const expectedArgFlattened = Block([
      Assignment('d', Variable('pi', 1), 2),
      Application(
        'bar',
        [Variable('d', 2)],
        null,
        Lambda(
          ['x'],
          Application(
            'foo',
            [Variable('x', 3), Variable('time', 0)],
            null,
            Lambda(
              ['a', 'b'],
              BinaryOp('*', Variable('b', 5), Variable('a', 4))
            ),
            [4, 5]
          )
        ),
        [3]
      )
    ]);

    assert.deepEqual(argFlattenedAst, expectedArgFlattened);
  });
});
