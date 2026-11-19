// Parent keys whose value is an object whose KEYS are user-supplied
// identifiers (e.g. placeholder→form-field maps echoed back from a commit).
// Symmetric with OPAQUE_OBJECT_PARENT_KEYS in camelToSnakeCase — both names
// (snake_case from wire, camelCase post-conversion) appear here because the
// recursion into an object happens AFTER its key has been camel-converted.
const OPAQUE_OBJECT_PARENT_KEYS = new Set([
  'placeholder_mapping',
  'placeholderMapping',
  'mapping',
  // A contract's typed-in and changed merge fields, keyed by merge field.
  'custom',
  'overrides',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive JSON transform; callers type the result
export function snakeToCamelCase(data: any, parentKey?: string): any {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => snakeToCamelCase(item));
  }

  if (parentKey && OPAQUE_OBJECT_PARENT_KEYS.has(parentKey)) {
    return data;
  }

  return Object.keys(data).reduce((result, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = snakeToCamelCase(data[key], camelKey);
    return result;
  }, {} as Record<string, unknown>);
}