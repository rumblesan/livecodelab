import * as helpers from './interpreter-funcs';
import _ from 'underscore';

var Interpreter = {};
export const internal = {};
Interpreter.internal = internal;

export const run = function(programBlock, globalscope) {
  var state = {
    exitCode: 0,
    doOnceTriggered: false
  };

  if (programBlock.ast !== 'BLOCK') {
    state.exitCode = 1;
    return state;
  }

  internal.evaluate(state, programBlock, globalscope);
  return state;
};

internal.evaluate = function(state, node, scope) {
  var output;

  switch (node.ast) {
    case 'BLOCK':
      output = internal.evaluateBlock(state, node, scope);
      break;

    case 'ASSIGNMENT':
      output = internal.evaluateAssignment(state, node, scope);
      break;

    case 'APPLICATION':
      output = internal.evaluateApplication(state, node, scope);
      break;

    case 'IF':
      output = internal.evaluateIf(state, node, scope);
      break;

    case 'LAMBDA':
      output = internal.evaluateLambda(state, node, scope);
      break;

    case 'TIMES':
      output = internal.evaluateTimes(state, node, scope);
      break;

    case 'DOONCE':
      output = internal.evaluateDoOnce(state, node, scope);
      break;

    case 'BINARYOP':
      output = internal.evaluateBinaryOp(state, node, scope);
      break;

    case 'UNARYOP':
      output = internal.evaluateUnaryOp(state, node, scope);
      break;

    case 'NUMBER':
      output = node.value;
      break;

    case 'VARIABLE':
      output = internal.evaluateVariable(state, node, scope);
      break;

    case 'DEINDEX':
      output = internal.evaluateDeIndex(state, node, scope);
      break;

    case 'STRING':
      output = node.value;
      break;

    case 'LIST':
      output = _.map(node.values, v => {
        return internal.evaluate(state, v, scope);
      });
      break;

    default:
      throw 'Unknown Symbol: ' + node.ast;
  }

  return output;
};

internal.evaluateBlock = function(state, block, scope) {
  var childScope = helpers.createChildScope(scope);
  var output = null;
  var i, el;
  for (i = 0; i < block.elements.length; i += 1) {
    el = block.elements[i];
    output = internal.evaluate(state, el, childScope);
  }

  return output;
};

internal.evaluateAssignment = function(state, assignment, scope) {
  var value = internal.evaluate(state, assignment.expression, scope);
  scope[assignment.identifier] = value;
  return value;
};

internal.evaluateApplication = function(state, application, scope) {
  var args, func, childScope, funcname, evaledargs, output, i, block;

  funcname = application.identifier;

  func = scope[funcname];
  if (!helpers.exists(func)) {
    throw 'Function not defined: ' + funcname;
  }

  evaledargs = application.args.map(function(arg) {
    return internal.evaluate(state, arg, scope);
  });

  // if this function call has a block section then add it to the args
  block = application.block;
  if (helpers.exists(block)) {
    evaledargs.push(function() {
      internal.evaluateBlock(state, block, scope);
    });
  }

  // functions are wrapped in an object with a function type
  // to differentiate between builtins and lambdas
  // user defined functions will be wrapped in a list so we unwrap them then call them
  if (func.type === 'builtin') {
    // apply is a method of the JS function object. it takes a scope
    // and then a list of arguments
    // eg
    //
    // var foo = function (a, b) {
    //     return a + b;
    // }
    //
    // var bar = foo.apply(window, [2, 3]);
    //
    // bar will equal 5

    output = func.func.apply(scope, evaledargs);
  } else if (func.type === 'lambda') {
    args = func.lambda.argNames;
    childScope = helpers.createChildScope(scope);
    for (i = 0; i < args.length; i += 1) {
      childScope[args[i]] = evaledargs[i];
    }
    output = internal.evaluate(state, func.lambda.body, childScope);
  } else {
    throw 'Error interpreting function: ' + funcname;
  }

  return output;
};

internal.evaluateIf = function(state, ifStatement, scope) {
  var predicate, ifblock, elseblock;

  predicate = ifStatement.predicate;
  ifblock = ifStatement.ifBlock;
  elseblock = ifStatement.elseBlock;

  if (internal.evaluate(state, predicate, scope)) {
    internal.evaluateBlock(state, ifblock, scope);
  } else if (helpers.exists(elseblock)) {
    internal.evaluateIf(state, elseblock, scope);
  }
};

internal.evaluateLambda = function(state, lambda) {
  return {
    type: 'lambda',
    lambda: lambda
  };
};

internal.evaluateTimes = function(state, times, scope) {
  var i;

  var loops = internal.evaluate(state, times.number, scope);
  var block = times.block;
  var loopVar = times.loopVar;
  var childScope = helpers.createChildScope(scope);

  for (i = 0; i < loops; i += 1) {
    childScope[loopVar] = i;

    internal.evaluate(state, block, childScope);
  }
};

internal.evaluateDoOnce = function(state, doOnce, scope) {
  if (doOnce.active) {
    state.doOnceTriggered = true;
    var output = internal.evaluate(state, doOnce.block, scope);
  } else {
    output = [];
  }
  return output;
};

internal.evaluateUnaryOp = function(state, operation, scope) {
  var output;
  var val1 = internal.evaluate(state, operation.expr1, scope);

  switch (operation.operator) {
    case '-':
      output = -1 * val1;
      break;

    case '!':
      output = !val1;
      break;

    default:
      throw 'Unknown Operator: ' + operation.operator;
  }

  return output;
};

internal.evaluateBinaryOp = function(state, binaryOp, scope) {
  var output;
  var val1 = internal.evaluate(state, binaryOp.expr1, scope);
  var val2 = internal.evaluate(state, binaryOp.expr2, scope);

  switch (binaryOp.operator) {
    case '+':
      output = val1 + val2;
      break;

    case '-':
      output = val1 - val2;
      break;

    case '*':
      output = val1 * val2;
      break;

    case '/':
      output = val1 / val2;
      break;

    case '^':
      output = Math.pow(val1, val2);
      break;

    case '%':
      output = val1 % val2;
      break;

    case '>':
      output = val1 > val2;
      break;

    case '<':
      output = val1 < val2;
      break;

    case '>=':
      output = val1 >= val2;
      break;

    case '<=':
      output = val1 <= val2;
      break;

    case '==':
      output = val1 === val2;
      break;

    case '&&':
      output = val1 && val2;
      break;

    case '||':
      output = val1 || val2;
      break;

    default:
      throw 'Unknown Operator: ' + binaryOp.operator;
  }

  return output;
};

internal.evaluateVariable = function(state, variable, scope) {
  var output = scope[variable.identifier];
  if (!helpers.exists(output)) {
    throw 'Undefined Variable: ' + variable.identifier;
  }
  return output;
};

internal.evaluateDeIndex = function(state, deindex, scope) {
  var collection = internal.evaluate(state, deindex.collection, scope);
  if (!_.isArray(collection)) {
    throw 'Must deindex lists';
  }
  var index = internal.evaluate(state, deindex.index, scope);
  if (!_.isNumber(index)) {
    throw 'Index must be a number';
  }
  var output = collection[index];
  return output;
};
