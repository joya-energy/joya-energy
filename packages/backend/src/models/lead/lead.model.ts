import { ILead, LeadStatus } from '@shared/interfaces';
import { type Model, type Document } from 'mongoose';
import { buildSchema } from '@backend/common/BaseSchema';
import { type ObjectId } from 'mongodb';
import { ModelsCollection } from '@backend/enums';
import { validateEmail, validatePhoneNumber } from '@shared/functions/user-check';
import { HTTP400Error } from '@backend/errors/http.error';

export type LeadDocument = ILead & Document<ObjectId>;

const LEAD_STATUSES: LeadStatus[] = ['nouveau', 'contacté', 'qualifié', 'converti', 'perdu'];

export const Lead: Model<LeadDocument> = buildSchema<LeadDocument>(
  ModelsCollection.LEAD,
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phoneNumber: { type: String, required: false, trim: true },
    name: { type: String, required: false, trim: true, maxlength: 100 },
    address: { type: String, required: false, trim: true, maxlength: 500 },
    companyName: { type: String, required: false, trim: true, maxlength: 100 },
    source: { type: String, required: false, trim: true }, // e.g., 'simulator', 'contact-form', 'newsletter'
    status: { 
      type: String, 
      enum: LEAD_STATUSES, 
      required: false, 
      default: 'nouveau',
      trim: true 
    },
  },
  {
    timestamps: true,
  },
  (schema) => {
    schema.pre('save', async function () {
      if (!validateEmail(this.email)) {
        throw new HTTP400Error('Wrong Email format');
      }
      // Validate phone number only if provided
      if (this.phoneNumber && !validatePhoneNumber(this.phoneNumber)) {
        throw new HTTP400Error('Wrong Phone Number format');
      }
      // Set default status if not provided
      if (!this.status) {
        this.status = 'nouveau';
      }
      // Validate status if provided
      if (this.status && !LEAD_STATUSES.includes(this.status as LeadStatus)) {
        throw new HTTP400Error(`Invalid status. Must be one of: ${LEAD_STATUSES.join(', ')}`);
      }
    });
  }
);
