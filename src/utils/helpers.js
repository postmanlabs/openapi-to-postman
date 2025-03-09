// Add any custom utility functions needed to replace Lodash
export const isEmpty = (value) => {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  return Object.keys(value).length === 0;
};

export const get = (obj, path, defaultValue) => {
  const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
  return value === undefined ? defaultValue : value;
};

// Add more utility functions as needed 