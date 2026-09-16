import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      return response.status(status).json(this.normalizeHttpResponse(payload, status, request));
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return response.status(409).json(this.normalizePrismaKnownRequestError(exception, request));
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return response.status(400).json(this.buildErrorBody(400, 'Datos de Prisma inválidos.', 'Bad Request', request));
    }

    return response.status(500).json(this.buildErrorBody(500, 'Error interno del servidor.', 'Internal Server Error', request));
  }

  private normalizeHttpResponse(payload: unknown, status: number, request: Request): ErrorBody {
    if (typeof payload === 'string') {
      return this.buildErrorBody(status, payload, HttpStatus[status] ?? 'Error', request);
    }

    if (typeof payload === 'object' && payload !== null) {
      const message = (payload as { message?: string }).message ?? 'Error de validación.';
      const error = (payload as { error?: string }).error ?? HttpStatus[status] ?? 'Error';
      return this.buildErrorBody(status, message, error, request);
    }

    return this.buildErrorBody(status, 'Error de solicitud.', HttpStatus[status] ?? 'Error', request);
  }

  private normalizePrismaKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
    request: Request,
  ): ErrorBody {
    if (exception.code === 'P2002') {
      const target = Array.isArray(exception.meta?.target)
        ? (exception.meta.target as string[]).join(', ')
        : 'campo';
      return this.buildErrorBody(
        409,
        `Conflicto de unicidad en ${target}. El valor ya existe.`,
        'Conflict',
        request,
      );
    }

    if (exception.code === 'P2025') {
      return this.buildErrorBody(404, 'Registro no encontrado.', 'Not Found', request);
    }

    if (exception.code === 'P2003') {
      return this.buildErrorBody(400, 'La relación referenciada no es válida.', 'Bad Request', request);
    }

    return this.buildErrorBody(500, 'Error de base de datos.', 'Internal Server Error', request);
  }

  private buildErrorBody(
    statusCode: number,
    message: string,
    error: string,
    request: Request,
  ): ErrorBody {
    return {
      statusCode,
      message,
      error,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };
  }
}
