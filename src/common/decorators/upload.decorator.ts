import { applyDecorators, UseInterceptors } from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import {
  createImageUploadConfig,
  createDocumentUploadConfig,
  createGeneralUploadConfig,
  UploadConfigOptions,
  createUploadConfig,
} from '../../config';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

// 单文件上传装饰器
export function SingleFileUpload(
  fieldName: string = 'file',
  options?: MulterOptions,
) {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, options)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
  );
}

// 多文件上传装饰器（相同字段名）
export function MultipleFileUpload(
  fieldName: string = 'files',
  maxCount: number = 10,
  options?: MulterOptions,
) {
  return applyDecorators(
    UseInterceptors(FilesInterceptor(fieldName, maxCount, options)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    }),
  );
}

// 多字段文件上传装饰器
export function MultiFieldFileUpload(
  uploadFields: Array<{ name: string; maxCount?: number }>,
  options?: MulterOptions,
) {
  const properties: Record<string, SchemaObject> = {};

  uploadFields.forEach((field) => {
    if (field.maxCount && field.maxCount > 1) {
      properties[field.name] = {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
      };
    } else {
      properties[field.name] = {
        type: 'string',
        format: 'binary',
      };
    }
  });

  return applyDecorators(
    UseInterceptors(FileFieldsInterceptor(uploadFields, options)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties,
      },
    }),
  );
}

// 图片上传装饰器
export function ImageUpload(
  fieldName: string = 'image',
  subPath: string = 'images',
  baseDir?: string,
) {
  const config = createImageUploadConfig(subPath, baseDir);
  return SingleFileUpload(fieldName, config);
}

// 文档上传装饰器
export function DocumentUpload(
  fieldName: string = 'document',
  subPath: string = 'documents',
  baseDir?: string,
) {
  const config = createDocumentUploadConfig(subPath, baseDir);
  return SingleFileUpload(fieldName, config);
}

// 头像上传装饰器
export function AvatarUpload(
  fieldName: string = 'avatar',
  subPath: string = 'avatars',
  baseDir?: string,
) {
  const config = createImageUploadConfig(subPath, baseDir);
  return SingleFileUpload(fieldName, config);
}

// 通用文件上传装饰器（支持自定义路径）
export function GeneralFileUpload(
  fieldName: string = 'file',
  subPath: string = 'files',
  baseDir?: string,
) {
  const config = createGeneralUploadConfig(subPath, baseDir);
  return SingleFileUpload(fieldName, config);
}

// 自定义上传装饰器
export function CustomUpload(
  fieldName: string = 'file',
  uploadOptions: UploadConfigOptions,
) {
  const config = createUploadConfig(uploadOptions);
  return SingleFileUpload(fieldName, config);
}

// 多图片上传装饰器
export function MultipleImageUpload(
  fieldName: string = 'images',
  maxCount: number = 10,
  subPath: string = 'images',
  baseDir?: string,
) {
  const config = createImageUploadConfig(subPath, baseDir);
  return MultipleFileUpload(fieldName, maxCount, config);
}

// 多文档上传装饰器
export function MultipleDocumentUpload(
  fieldName: string = 'documents',
  maxCount: number = 5,
  subPath: string = 'documents',
  baseDir?: string,
) {
  const config = createDocumentUploadConfig(subPath, baseDir);
  return MultipleFileUpload(fieldName, maxCount, config);
}
