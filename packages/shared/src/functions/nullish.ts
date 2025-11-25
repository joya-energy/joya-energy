export function isNullish<T>(val: T | null | undefined): val is null | undefined {
    return val === null || val === undefined;
  }
  
  export function isNotNullish<T>(val: T | null | undefined): val is T {
    return !isNullish(val);
  }
  
  export function isEmptyObject(val: object | null | undefined): val is null | undefined {
    if (isNullish(val)) return true;
    return Object.keys(val).length === 0;
  }
  
  export function isNotEmptyObject(val: object | null | undefined): val is object {
    return !isEmptyObject(val);
  }
  
  export function isEmptyArray(val: any[] | null | undefined): val is null | undefined {
    if (isNullish(val)) return true;
    return val.length === 0;
  }
  
  export function isNotEmptyArray(val: any[] | null | undefined): val is any[] {
    return !isEmptyArray(val);
  }
  