import { type Request, type Response } from 'express';
import { contactService } from './contact.service';
import { type IContact } from '@shared/interfaces/contact.interface';
import { HttpStatusCode, type PaginatedResult } from '@shared';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';

export class ContactController {
  public createContact = async (req: Request, res: Response<IContact>): Promise<void> => {
    try {
      const contact = await contactService.createContact(req.body);
      res.status(HttpStatusCode.CREATED).json(contact);
    } catch (error) {
      Logger.error(`Error: Contact not created: ${String(error)}`);
      throw new HTTP400Error('Error: Contact not created', error);
    }
  };

  public getContacts = async (req: Request, res: Response<PaginatedResult<IContact>>): Promise<void> => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await contactService.getContacts({ page, limit });
      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      Logger.error(`Error: Contacts not found: ${String(error)}`);
      throw new HTTP404Error('Error: Contacts not found', error);
    }
  };

  public getContactById = async (req: Request, res: Response<IContact>): Promise<void> => {
    try {
      const { id } = req.params;
      const contact = await contactService.getContactById(id);
      res.status(HttpStatusCode.OK).json(contact);
    } catch (error) {
      Logger.error(`Error: Contact not found: ${String(error)}`);
      throw new HTTP404Error('Error: Contact not found', error);
    }
  };

  public deleteContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await contactService.deleteContact(id);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      Logger.error(`Error: Contact not deleted: ${String(error)}`);
      throw new HTTP400Error('Error: Contact not deleted', error);
    }
  };
}

export const contactController = new ContactController();
