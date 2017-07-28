/**
 *  elements: [Element]
 */
export const Block = function(elements) {
  return {
    ast: 'BLOCK',
    elements: elements
  };
};

/**
 *  identifier: Identifier
 *  expression: Expression
 */
export const Assignment = function(identifier, expression) {
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
export const Application = function(identifier, args, block) {
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
export const If = function(predicate, ifBlock, elseBlock) {
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
export const Lambda = function(argNames, body, inlinable) {
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
export const Times = function(number, block, loopVar) {
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
export const DoOnce = function(active, block) {
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
export const UnaryOp = function(operator, expr1) {
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
export const BinaryOp = function(operator, expr1, expr2) {
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
export const DeIndex = function(collection, index) {
  return {
    ast: 'DEINDEX',
    collection: collection,
    index: index
  };
};

/**
 *  value: Number
 */
export const Num = function(value) {
  return {
    ast: 'NUMBER',
    value: value
  };
};

/**
 *  value: Identifier
 */
export const Variable = function(identifier) {
  return {
    ast: 'VARIABLE',
    identifier: identifier
  };
};

/**
 *  value: String
 */
export const Str = function(value) {
  return {
    ast: 'STRING',
    value: value
  };
};

/**
 *  value: List
 */
export const List = function(values) {
  return {
    ast: 'LIST',
    values: values
  };
};

/**
 */
export const Comment = function() {
  return {
    ast: 'COMMENT'
  };
};
