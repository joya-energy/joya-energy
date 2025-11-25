import { Types } from 'mongoose';
import { ContactService } from '../../../modules/contact';
import { AppError } from '../../../errors';

jest.mock('../../../models/contact', () => ({
  ContactModel: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn()
  }
}));

jest.mock('../../../common/mail', () => ({
  mailService: {
    sendMail: jest.fn()
  }
}));

const { ContactModel } = jest.requireMock('../../../models/contact');
const { mailService } = jest.requireMock('../../../common/mail');

const service = new ContactService();
const mockDocument = {
  _id: new Types.ObjectId(),
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello',
  createdAt: new Date(),
  updatedAt: new Date()
};

const expectedContact = {
  id: mockDocument._id.toString(),
  name: mockDocument.name,
  email: mockDocument.email,
  message: mockDocument.message,
  createdAt: mockDocument.createdAt,
  updatedAt: mockDocument.updatedAt
};

const findMock = {
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn()
};

const countMock = {
  exec: jest.fn()
};

describe('ContactService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findMock.sort.mockReturnThis();
    findMock.skip.mockReturnThis();
    findMock.limit.mockReturnThis();
    findMock.exec.mockReset();
    countMock.exec.mockReset();
    (ContactModel.find as jest.Mock).mockReturnValue(findMock);
    (ContactModel.countDocuments as jest.Mock).mockReturnValue(countMock);
  });

  describe('createContact', () => {
    it('creates a contact and triggers a notification email', async () => {
      (ContactModel.create as jest.Mock).mockResolvedValue(mockDocument);

      const result = await service.createContact({
        name: mockDocument.name,
        email: mockDocument.email,
        message: mockDocument.message
      });

      expect(ContactModel.create).toHaveBeenCalledWith({
        name: mockDocument.name,
        email: mockDocument.email,
        message: mockDocument.message
      });
      expect(mailService.sendMail).toHaveBeenCalled();
      expect(result).toEqual(expectedContact);
    });
  });

  describe('getContacts', () => {
    it('returns paginated contacts', async () => {
      findMock.exec.mockResolvedValue([mockDocument]);
      countMock.exec.mockResolvedValue(1);

      const result = await service.getContacts({ page: 1, limit: 10 });

      expect(ContactModel.find).toHaveBeenCalled();
      expect(findMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(findMock.skip).toHaveBeenCalledWith(0);
      expect(findMock.limit).toHaveBeenCalledWith(10);
      expect(findMock.exec).toHaveBeenCalled();
      expect(countMock.exec).toHaveBeenCalled();
      expect(result).toEqual({
        data: [expectedContact],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });
  });

  describe('getContactById', () => {
    it('throws when id is invalid', async () => {
      await expect(service.getContactById('invalid-id')).rejects.toThrow(AppError);
    });

    it('returns a contact when found', async () => {
      const id = new Types.ObjectId().toHexString();
      (ContactModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockDocument) });

      const result = await service.getContactById(id);

      expect(ContactModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedContact);
    });

    it('throws AppError when contact not found', async () => {
      const id = new Types.ObjectId().toHexString();
      (ContactModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.getContactById(id)).rejects.toThrow(AppError);
    });
  });

  describe('deleteContact', () => {
    it('deletes the contact when found', async () => {
      const id = new Types.ObjectId().toHexString();
      (ContactModel.findByIdAndDelete as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockDocument) });

      await service.deleteContact(id);

      expect(ContactModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('throws AppError when contact not found', async () => {
      const id = new Types.ObjectId().toHexString();
      (ContactModel.findByIdAndDelete as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.deleteContact(id)).rejects.toThrow(AppError);
    });
  });
});
