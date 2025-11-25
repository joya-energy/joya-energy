/* eslint-disable @typescript-eslint/consistent-type-definitions */
export type BaseDoc = {
    id: string;
    _id?: string;
  };
  
  export type OmitGeneric = string | Record<string, unknown>;
  
  // eslint-disable-next-line @typescript-eslint/ban-types
  export type OmitObject<T, E extends OmitGeneric = {}> = Omit<T, E extends string ? E : keyof E>;
  
  export type Modify<T, R> = Omit<T, keyof R> & R;
  
  export type PartialDeep<T> = {
    [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
  };  