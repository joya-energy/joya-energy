import { Router } from 'express';
import { contactController } from './contact.controller';
export const contactRoutes = Router();

contactRoutes.post('/', contactController.createContact);
contactRoutes.get('/', contactController.getContacts);
contactRoutes.get('/:id', contactController.getContactById);
contactRoutes.delete('/:id', contactController.deleteContact);
