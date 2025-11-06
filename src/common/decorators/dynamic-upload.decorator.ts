import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// 生成文件名
const generateFileName = (originalname: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1e9);
  const ext = extname(originalname);
  return `${timestamp}-${randomSuffix}${ext}`;
};

// 确保目录存在
const ensureDirectoryExists = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

// 动态路径单文件上传装饰器
export function DynamicSingleFileUpload(
  fieldName: string = 'file',
  pathExtractor: (req: any) => string,
  allowedTypes: string[] = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  maxSize: number = 5 * 1024 * 1024,
) {
  const multerOptions = {
    storage: diskStorage({
      destination: (req, file, cb) => {
        try {
          const dynamicPath = pathExtractor(req);
          const uploadPath = join(
            process.cwd(),
            'public',
            'uploads',
            dynamicPath,
          );
          ensureDirectoryExists(uploadPath);
          cb(null, uploadPath);
        } catch (error) {
          cb(new BadRequestException('无法确定上传路径'), '');
        }
      },
      filename: (req, file, cb) => {
        const filename = generateFileName(file.originalname);
        cb(null, filename);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(`不支持的文件类型: ${file.mimetype}`),
          false,
        );
      }
    },
    limits: {
      fileSize: maxSize,
    },
  };

  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, multerOptions)),
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

// 动态路径多文件上传装饰器
export function DynamicMultipleFileUpload(
  fieldName: string = 'files',
  maxCount: number = 10,
  pathExtractor: (req: any) => string,
  allowedTypes: string[] = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  maxSize: number = 5 * 1024 * 1024,
) {
  const multerOptions = {
    storage: diskStorage({
      destination: (req, file, cb) => {
        try {
          const dynamicPath = pathExtractor(req);
          const uploadPath = join(
            process.cwd(),
            'public',
            'uploads',
            dynamicPath,
          );
          ensureDirectoryExists(uploadPath);
          cb(null, uploadPath);
        } catch (error) {
          cb(new BadRequestException('无法确定上传路径'), '');
        }
      },
      filename: (req, file, cb) => {
        const filename = generateFileName(file.originalname);
        cb(null, filename);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(`不支持的文件类型: ${file.mimetype}`),
          false,
        );
      }
    },
    limits: {
      fileSize: maxSize,
    },
  };

  return applyDecorators(
    UseInterceptors(FilesInterceptor(fieldName, maxCount, multerOptions)),
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
