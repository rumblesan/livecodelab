/* global describe, it */

var parser = require('../../src/grammar/lcl');
import * as ast from '../../src/js/lcl/ast';

var dedent = require('dentist').dedent;

var assert = require('assert');

describe('Lazy Lambda', function() {
  it('lazy lambda is parsed', function() {
    var program = 'foo = <box 3, 4>';
    var parsed = parser.parse(program, {
      functionNames: ['box'],
      inlinableFunctions: ['box']
    });

    var expected = ast.Block([
      ast.Assignment(
        'foo',
        ast.Lambda(
          [],
          ast.Block([ast.Application('box', [ast.Num(3), ast.Num(4)], null)]),
          true
        )
      )
    ]);

    assert.deepEqual(parsed, expected);
  });

  it('lazy lambda is created and used', function() {
    var program = dedent(`
                         foo = <box 3, 4>
                         rotate
                         \tfoo
                         `);
    var parsed = parser.parse(program, {
      functionNames: ['rotate', 'box'],
      inlinableFunctions: ['rotate', 'box']
    });

    var expected = ast.Block([
      ast.Assignment(
        'foo',
        ast.Lambda(
          [],
          ast.Block([ast.Application('box', [ast.Num(3), ast.Num(4)], null)]),
          true
        )
      ),
      ast.Application(
        'rotate',
        [],
        ast.Block([ast.Application('foo', [], null)])
      )
    ]);

    assert.deepEqual(parsed, expected);
  });

  it('lazy lambda is inlinable', function() {
    var program = dedent(`
                         bigger = <scale 1.1>
                         rotate bigger box
                         `);
    var parsed = parser.parse(program, {
      functionNames: ['rotate', 'box', 'scale'],
      inlinableFunctions: ['rotate', 'box', 'scale']
    });

    var expected = ast.Block([
      ast.Assignment(
        'bigger',
        ast.Lambda(
          [],
          ast.Block([ast.Application('scale', [ast.Num(1.1)], null)]),
          true
        )
      ),
      ast.Application(
        'rotate',
        [],
        ast.Block([
          ast.Application(
            'bigger',
            [],
            ast.Block([ast.Application('box', [], null)])
          )
        ])
      )
    ]);

    assert.deepEqual(parsed, expected);
  });
});
