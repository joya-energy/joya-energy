import { BaseDoc, OmitGeneric, OmitObject } from "@shared/types/global.type";

export interface BusinessObject {
    id: string;
  }
  
  export interface EmbeddedBusinessObject {
    _id: string;
  }
  
export type CreateBusinessObject<T extends BusinessObject, E extends OmitGeneric = {}> = OmitObject<T, E & BaseDoc>;
export type UpdateBusinessObject<T extends BusinessObject, E extends OmitGeneric = {}> = OmitObject<T, E & BaseDoc>;

export type CreateEmbeddedBusinessObject<T extends EmbeddedBusinessObject, E extends OmitGeneric = {}> = OmitObject<T, E & BaseDoc>;
export type UpdateEmbeddedBusinessObject<T extends EmbeddedBusinessObject, E extends OmitGeneric = {}> = OmitObject<T, E & BaseDoc>;

export type CreateBaseObject<T extends EmbeddedBusinessObject, E extends OmitGeneric = {}> = OmitObject<T, E>;
export type UpdateBaseObject<T extends EmbeddedBusinessObject, E extends OmitGeneric = {}> = OmitObject<T, E>;