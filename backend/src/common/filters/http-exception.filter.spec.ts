import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockHost: ArgumentsHost;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockRequest = { url: '/test-url' };
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = { status: mockStatus };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest as Request,
        getResponse: () => mockResponse as Response,
      }),
    } as any;
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
        error: 'HttpException',
        path: '/test-url',
      }),
    );
  });

  it('should handle HttpException with object response', () => {
    const responseObj = { message: 'Bad Request', error: 'CustomError' };
    const exception = new HttpException(responseObj, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Bad Request',
        error: 'HttpException',
      }),
    );
  });

  it('should handle HttpException with array message', () => {
    const responseObj = { message: ['Error 1', 'Error 2'], error: 'Validation' };
    const exception = new HttpException(responseObj, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error 1, Error 2',
      }),
    );
  });

  it('should extract custom code and details', () => {
    const responseObj = { message: 'Error', code: 'CUSTOM_CODE', extraData: 123 };
    const exception = new HttpException(responseObj, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CUSTOM_CODE',
        details: { extraData: 123 },
      }),
    );
  });

  it('should handle non-HttpException in dev mode', () => {
    process.env.NODE_ENV = 'development';
    const exception = new Error('Some random error');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Some random error',
        error: 'Internal Server Error',
      }),
    );
  });

  it('should handle non-HttpException in production mode', () => {
    process.env.NODE_ENV = 'production';
    const exception = new Error('Some random error');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Une erreur interne est survenue.',
        error: 'Internal Server Error',
      }),
    );
    process.env.NODE_ENV = 'test'; // reset
  });
});
