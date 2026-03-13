import { describe, it, expect } from 'vitest';
import { builtInValidators, parseRules, validate } from '../validation.js';

describe('parseRules', () => {
  it('parses an array of string rules', () => {
    const rules = parseRules(['required']);
    expect(rules).toEqual([{ type: 'required' }]);
  });

  it('parses multiple rules with arguments', () => {
    const rules = parseRules(['required', 'email', 'minLength:5']);
    expect(rules).toHaveLength(3);
    expect(rules[0]).toEqual({ type: 'required' });
    expect(rules[1]).toEqual({ type: 'email' });
    expect(rules[2]).toEqual({ type: 'minLength', arg: 5 });
  });

  it('returns empty array for non-array input', () => {
    expect(parseRules('required')).toEqual([]);
    expect(parseRules(undefined)).toEqual([]);
    expect(parseRules(null)).toEqual([]);
  });
});

describe('validate', () => {
  it('returns undefined for valid required field', () => {
    const rules = parseRules(['required']);
    const error = validate('hello', rules, builtInValidators);
    expect(error).toBeUndefined();
  });

  it('returns error message for empty required field', () => {
    const rules = parseRules(['required']);
    const error = validate('', rules, builtInValidators);
    expect(error).toBe('This field is required');
  });

  it('validates email format', () => {
    const rules = parseRules(['email']);
    expect(validate('user@example.com', rules, builtInValidators)).toBeUndefined();
    expect(validate('invalid', rules, builtInValidators)).toBe('Please enter a valid email');
  });

  it('validates minLength', () => {
    const rules = parseRules(['minLength:3']);
    expect(validate('ab', rules, builtInValidators)).toBe('Must be at least 3 characters');
    expect(validate('abc', rules, builtInValidators)).toBeUndefined();
  });
});

describe('builtInValidators', () => {
  it('has required validator', () => {
    expect(builtInValidators['required']).toBeDefined();
  });

  it('has email validator', () => {
    expect(builtInValidators['email']).toBeDefined();
  });

  it('has minLength validator', () => {
    expect(builtInValidators['minLength']).toBeDefined();
  });

  it('has url validator', () => {
    expect(builtInValidators['url']).toBeDefined();
  });
});
