/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

import { parseJSON } from '@shared';
import { type ObjectId } from 'mongodb';
import { type Document } from 'mongoose';

export interface ICommonDataAdapter<BOType, DBType> {
  fromDBtoBO: (dbEntity: DBType) => BOType;
  fromBOtoDB: (boEntity: BOType) => DBType;
}

export class CommonDataAdapter<T, D = Document<ObjectId> & T> implements ICommonDataAdapter<T, D> {
  fromDBtoBO(dbEntity: D): T {
    const jsonEntity = (dbEntity as Document).toJSON<any>();
    delete jsonEntity._id;
    // Note: This will stringify all ObjectId
    return parseJSON(jsonEntity);
  }

  fromBOtoDB(boEntity: T): D {
    return boEntity as any;
  }
}
