/* eslint-disable n/no-callback-literal */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { ObjectId } from 'mongodb';
import {
  Schema,
  type Document,
  type SchemaDefinition,
  type SchemaDefinitionType,
  model,
  models,
  type Model,
  type SchemaOptions
} from 'mongoose';

export type BaseEntity = Document<string>;
export type CreateEntity<T> = T;
export type Entity<T> = T;
export type EntityWithId<T> = T & { _id: ObjectId };

export const buildSchema = <I, D extends { _id: ObjectId } = Document<ObjectId> & I>(
  collectionName: string,
  schemaDef: SchemaDefinition<SchemaDefinitionType<D>>,
  options: SchemaOptions = {},
  applyHooks: (schema: Schema<D>) => void = () => {}
): Model<D> => {
  // Check if the model has already been defined, and return it
  // This is useful for cases where the model gets defined twice which causes a mongoose error
  const definedModel = models[collectionName];
  if (definedModel) {
    return definedModel;
  }

  const defaultOptions: SchemaOptions = {
    ...{ toObject: { versionKey: false, getters: true, virtuals: true } },
    ...{ toJSON: { versionKey: false, getters: true, virtuals: true } },
    ...options
  };

  // Bizarre et ça m'embête, mais le any est la seule façon de faire pour que mongoose accepte les options...
  const _schema = new Schema<D>(schemaDef, defaultOptions as any);

  // Common hooks

  onFirstCreation(_schema, (doc) => {
    // Generate _id at creation
    doc._id = new ObjectId();
  });

  applyHooks(_schema);

  // By specifying _id explicitly, we override mongoose default generation behavior
  _schema.add(new Schema({ _id: { type: ObjectId, auto: true, immutable: true, required: true } }));

  return model<D>(collectionName, _schema);
};

export function onFirstCreation<D>(schema: Schema<D>, cb: (ctx: D) => void) {
  schema.pre('save', function (this) {
    if (this.isNew) {
      cb(this as D);
    }
  });
}

export function onManyInsertion<D>(schema: Schema<D>, cb: (ctx: D[]) => void) {
  schema.pre('insertMany', (next: any, docs: D[]) => {
    cb(docs);
    next();
  });
}
