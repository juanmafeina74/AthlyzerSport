import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Prisma } from '@prisma/client';
import { GlobalExceptionFilter } from './common/global-exception.filter.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  it('should serialize Prisma unique-error payloads into a useful JSON contract', () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const handler = new GlobalExceptionFilter();
    const exception = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`dni`)',
      {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['dni'] },
      },
    );

    handler.catch(exception, {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/api/jugadores' }),
      }),
    } as any);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: expect.stringContaining('dni'),
        error: 'Conflict',
      }),
    );
  });
});
