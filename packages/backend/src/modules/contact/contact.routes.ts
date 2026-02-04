import asyncRouter from 'express-promise-router';
import { contactController } from './contact.controller';

export const contactRoutes = asyncRouter();

contactRoutes.post('/', contactController.createContact);
contactRoutes.get('/', contactController.getContacts);
contactRoutes.get('/:id', contactController.getContactById);
contactRoutes.delete('/:id', contactController.deleteContact);
