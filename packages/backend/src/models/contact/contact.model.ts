import { IContact } from '@shared/interfaces';
import { type Model, type Document } from 'mongoose';
import { buildSchema } from '@backend/common/BaseSchema';
import { type ObjectId } from 'mongodb';
import { ModelsCollection } from '@backend/enums';
import {
  validateEmail,
  validatePhoneNumber,
} from '@shared/functions/user-check';
import { HTTP400Error } from '@backend/errors/http.error';
export type ContactDocument = IContact & Document<ObjectId>;

export const Contact: Model<ContactDocument> = buildSchema<ContactDocument>(
  ModelsCollection.CONTACT,
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, trim: true, maxlength: 5000 },
    phoneNumber: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    companyName: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
  (schema) => {
    schema.pre('save', async function () {
      console.log(
        'Phone number before validation:',
        this.phoneNumber,
        typeof this.phoneNumber
      );

      if (!validateEmail(this.email)) {
        throw new HTTP400Error('Wrong Email format');
      }
      if (!validatePhoneNumber(this.phoneNumber)) {
        throw new HTTP400Error('Wrong Phone Number format');
      }
    });
  }
);
