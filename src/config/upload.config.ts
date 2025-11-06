import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// 允许的文件类型
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXCEL_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// 生成文件名
const generateFileName = (originalname: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1e9);
  const ext = extname(originalname);
  return `${timestamp}-${randomSuffix}${ext}`;
};

// 生成文件访问URL
export const generateFileUrl = (subPath: string, filename: string): string => {
  const protocol = process.env.SERVET_AGREEMENT || 'http';
  const host = process.env.SERVET_HOST || 'localhost';
  const port = process.env.SERVET_PORT || '3000';
  const staticPrefix = process.env.SERVET_FILE_STATIC || '/static';

  const baseUrl = `${protocol}://${host}:${port}`;
  return `${baseUrl}${staticPrefix}/uploads/${subPath}/${filename}`;
};

// 删除文件
export const deleteFile = (fileUrl: string): boolean => {
  try {
    const fs = require('fs');
    const path = require('path');

    // 从URL中提取文件路径
    // 例如: http://localhost:3000/static/uploads/company/123456.png
    // 提取: uploads/company/123456.png
    const staticPrefix = process.env.SERVET_FILE_STATIC || '/static';
    const urlParts = fileUrl.split(`${staticPrefix}/`);

    if (urlParts.length > 1) {
      const relativePath = urlParts[1];
      const filePath = path.join(process.cwd(), 'public', relativePath);

      // 检查文件是否存在并删除
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    }
    return false;
  } catch (error) {
    // 静默处理删除错误
    console.warn('删除文件失败:', error.message);
    return false;
  }
};

// 确保目录存在
const ensureDirectoryExists = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

// 通用上传配置接口
export interface UploadConfigOptions {
  subPath: string;
  allowedTypes: string[];
  maxSize?: number;
  baseDir?: string; // 基础目录,默认为 'public/uploads'
}

// 通用上传配置
export const createUploadConfig = (
  options: UploadConfigOptions,
): MulterOptions => {
  const {
    subPath,
    allowedTypes,
    maxSize = 5 * 1024 * 1024, // 默认5MB
    baseDir = 'public/uploads',
  } = options;

  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(process.cwd(), baseDir, subPath);

        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
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
};

// 图片上传配置
export const imageUploadConfig: MulterOptions = createUploadConfig({
  subPath: 'images',
  allowedTypes: ALLOWED_IMAGE_TYPES,
  maxSize: 5 * 1024 * 1024, // 5MB
});

// 文档上传配置
export const documentUploadConfig: MulterOptions = createUploadConfig({
  subPath: 'documents',
  allowedTypes: [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_EXCEL_TYPES],
  maxSize: 10 * 1024 * 1024, // 10MB
});

// 通用文件上传配置
export const generalUploadConfig: MulterOptions = createUploadConfig({
  subPath: 'files',
  allowedTypes: [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
    ...ALLOWED_EXCEL_TYPES,
  ],
  maxSize: 10 * 1024 * 1024, // 10MB
});

// 预定义上传配置函数
export const createImageUploadConfig = (
  subPath: string = 'images',
  baseDir?: string,
) =>
  createUploadConfig({
    subPath,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: 5 * 1024 * 1024,
    baseDir,
  });

export const createDocumentUploadConfig = (
  subPath: string = 'documents',
  baseDir?: string,
) =>
  createUploadConfig({
    subPath,
    allowedTypes: [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_EXCEL_TYPES],
    maxSize: 10 * 1024 * 1024,
    baseDir,
  });

export const createGeneralUploadConfig = (
  subPath: string = 'files',
  baseDir?: string,
) =>
  createUploadConfig({
    subPath,
    allowedTypes: [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
      ...ALLOWED_EXCEL_TYPES,
    ],
    maxSize: 10 * 1024 * 1024,
    baseDir,
  });
