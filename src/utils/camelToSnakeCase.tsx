// Parent keys whose value is an object whose KEYS are user-supplied
// identifiers, not JS-style camelCase. Recursively transforming those keys
// corrupts the wire format — e.g. a template-rewrite mapping with key
// `(EXP)Equipment-Scannerconditions` becomes `(_e_x_p)_equipment-_scannerconditions`,
// which no longer matches anything the server can find. Add a key here only
// after confirming the corresponding endpoint accepts identifier-shaped keys
// verbatim.
// `custom` / `overrides`: a contract's typed-in and changed merge fields, keyed by
// merge field (e.g. restraint_area, employee.id).
const OPAQUE_OBJECT_PARENT_KEYS = new Set(['mapping', 'custom', 'overrides']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive JSON transform; callers type the result
export function camelToSnakeCase(data: any, parentKey?: string): any {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    // If parent key is required_when or read_only_when, preserve camelCase for nested objects
    if (parentKey === 'required_when' || parentKey === 'read_only_when') {
      return data; // Return array as-is without converting nested keys
    }
    return data.map(item => camelToSnakeCase(item));
  }

  // Opaque-keyed objects: leave keys alone (values still pass through, but
  // since they're typically primitive strings the recursion is a no-op).
  if (parentKey && OPAQUE_OBJECT_PARENT_KEYS.has(parentKey)) {
    return data;
  }

  return Object.keys(data).reduce((result, key) => {
    // Skip transformation for special keys like _method that might be used for PUT/DELETE requests
    if (key.startsWith('_')) {
      result[key] = camelToSnakeCase(data[key], key);
      return result;
    }

    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = camelToSnakeCase(data[key], snakeKey);
    return result;
  }, {} as Record<string, unknown>);
}