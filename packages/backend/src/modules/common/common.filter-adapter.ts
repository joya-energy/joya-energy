/* eslint-disable @typescript-eslint/no-extraneous-class */
import { type FilterQuery } from 'mongoose';

export class CommonFilterAdapter {
  static fromApiToMongoose<D>(filter: any = {}): FilterQuery<D> {
    // TODO : perform filter conversion and adaptation to mongoose filters
    const convertedFilter = { ...filter };

    // convert 'null' query fields to mongo existence query $exists
    Object.keys(filter).forEach((key) => {
      if (filter[key] === null || filter[key] === 'null') {
        convertedFilter[key] = { $exists: false };
      }
      // Handling case of mongoose $ queries like $or or $and...
      if (filter[key]?.length > 3 && filter[key]?.substring(0, 3) === '{"$') {
        convertedFilter[key] = JSON.parse(filter[key]);
      }
    });

    return convertedFilter;
  }
}
