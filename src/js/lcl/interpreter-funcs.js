export function exists(val) {
  return val !== undefined && val !== null;
}

export function createChildScope(parentScope) {
  return Object.create(parentScope);
}
