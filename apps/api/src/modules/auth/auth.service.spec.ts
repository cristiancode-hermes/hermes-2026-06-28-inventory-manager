import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
  compare: jest.fn().mockResolvedValue(true),
};

jest.mock('bcryptjs', () => ({
  hash: (...args: any[]) => mockBcrypt.hash(...args),
  compare: (...args: any[]) => mockBcrypt.compare(...args),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let orgRepo: any;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOrgRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    orgRepo = module.get(getRepositoryToken(Organization));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create organization and user, return accessToken', async () => {
      mockUserRepo.findOne.mockResolvedValue(null); // no duplicate
      mockOrgRepo.create.mockReturnValue({ id: 1, name: 'Test Corp' });
      mockOrgRepo.save.mockResolvedValue({ id: 1, name: 'Test Corp' });
      mockUserRepo.create.mockReturnValue({
        id: 1,
        email: 'test@test.com',
        name: 'Test',
        organizationId: 1,
      });
      mockUserRepo.save.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        name: 'Test',
        organizationId: 1,
      });

      const result = await service.register({
        email: 'test@test.com',
        name: 'Test',
        password: 'password123',
        organizationName: 'Test Corp',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('test-jwt-token');
      expect(orgRepo.create).toHaveBeenCalledWith({ name: 'Test Corp' });
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should reject duplicate email with ConflictException', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, email: 'existing@test.com' });

      await expect(
        service.register({
          email: 'existing@test.com',
          name: 'Test',
          password: 'password123',
          organizationName: 'Test Corp',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should validate credentials and return accessToken', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword123',
        name: 'Test',
        organizationId: 1,
      });

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('test-jwt-token');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
    });

    it('should reject invalid email with UnauthorizedException', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject wrong password with UnauthorizedException', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword123',
      });
      mockBcrypt.compare.mockResolvedValueOnce(false); // wrong password

      await expect(
        service.login({
          email: 'test@test.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
