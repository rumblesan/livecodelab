var Ast = {};
Ast.Node = {};
Ast.Helpers = {};

/**
 *  elements: [Element]
 */
Ast.Node.Block = function(elements) {
  return {
    ast: 'BLOCK',
    elements: elements
  };
};

/**
 *  identifier: Identifier
 *  expression: Expression
 */
Ast.Node.Assignment = function(identifier, expression) {
  return {
    ast: 'ASSIGNMENT',
    identifier: identifier,
    expression: expression
  };
};

/**
 *  identifier: Identifier
 *  args:       [Expression]
 */
Ast.Node.Application = function(identifier, args, block) {
  return {
    ast: 'APPLICATION',
    identifier: identifier,
    args: args,
    block: block
  };
};

/**
 *  predicate: Expression
 *  ifBlock:   Block
 *  elseBlock: Block
 */
Ast.Node.If = function(predicate, ifBlock, elseBlock) {
  return {
    ast: 'IF',
    predicate: predicate,
    ifBlock: ifBlock,
    elseBlock: elseBlock
  };
};

/**
 *  argNames:  [Identifier]
 *  body:      Block
 *  inlinable: Boolean
 */
Ast.Node.Lambda = function(argNames, body, inlinable) {
  return {
    ast: 'LAMBDA',
    argNames: argNames,
    body: body,
    inlinable: inlinable || false
  };
};

/**
 *  number:  Expression
 *  block:   Block
 *  loopVar: Identifier
 */
Ast.Node.Times = function(number, block, loopVar) {
  return {
    ast: 'TIMES',
    number: number,
    block: block,
    loopVar: loopVar
  };
};

/**
 *  block: Block
 */
Ast.Node.DoOnce = function(active, block) {
  return {
    ast: 'DOONCE',
    active: active,
    block: block
  };
};

/**
 *  operation: String
 *  expr1: Expression
 */
Ast.Node.UnaryOp = function(operator, expr1) {
  return {
    ast: 'UNARYOP',
    operator: operator,
    expr1: expr1
  };
};

/**
 *  operation: String
 *  expr1: Expression
 *  expr2: Expression
 */
Ast.Node.BinaryOp = function(operator, expr1, expr2) {
  return {
    ast: 'BINARYOP',
    operator: operator,
    expr1: expr1,
    expr2: expr2
  };
};

/**
 *  collection: Expression
 *  index: Expression
 */
Ast.Node.DeIndex = function(collection, index) {
  return {
    ast: 'DEINDEX',
    collection: collection,
    index: index
  };
};

/**
 *  value: Number
 */
Ast.Node.Num = function(value) {
  return {
    ast: 'NUMBER',
    value: value
  };
};

/**
 *  value: Identifier
 */
Ast.Node.Variable = function(identifier) {
  return {
    ast: 'VARIABLE',
    identifier: identifier
  };
};

/**
 *  value: String
 */
Ast.Node.Str = function(value) {
  return {
    ast: 'STRING',
    value: value
  };
};

/**
 *  value: List
 */
Ast.Node.List = function(values) {
  return {
    ast: 'LIST',
    values: values
  };
};

/**
 */
Ast.Node.Comment = function() {
  return {
    ast: 'COMMENT'
  };
};

module.exports = Ast;
