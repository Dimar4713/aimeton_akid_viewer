'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const ctx = {
  S: { assignments: {} },
  console,
  Array,
  String,
  Object,
  Math,
  Date
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('app-multi-assignment.js', 'utf8'), ctx, { filename: 'app-multi-assignment.js' });

ctx.setAssignees(1, ['Иванов И.И.', 'Петров П.П.', 'Иванов И.И.']);
assert.deepStrictEqual(Array.from(ctx.assigneesFor(1)), ['Иванов И.И.', 'Петров П.П.']);
assert.strictEqual(ctx.hasAssignee(1, 'Иванов И.И.'), true);
assert.strictEqual(ctx.hasAssignee(1, 'Сидоров С.С.'), false);
assert.strictEqual(ctx.assigneesLabel(1), 'Иванов И.И., Петров П.П.');

ctx.S.assignments[2] = 'Legacy User';
assert.deepStrictEqual(Array.from(ctx.assigneesFor(2)), ['Legacy User']);
assert.strictEqual(ctx.hasAssignee(2, 'Legacy User'), true);

ctx.setAssignees(1, []);
assert.deepStrictEqual(Array.from(ctx.assigneesFor(1)), []);
assert.strictEqual(Object.prototype.hasOwnProperty.call(ctx.S.assignments, 1), false);

console.log('multi-assignment smoke: ok');
