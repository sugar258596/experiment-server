'use strict';

const path = require('path');
const fs = require('fs');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

/**
 * 上传配置工具类
 * 参考 NestJS 上传实现
 */

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

/**
 * 生成唯一文件名
 * @param {string} originalFilename - 原始文件名
 * @return {string} 生成的文件名
 */
const generateFileName = (originalFilename) => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1e9);
  const ext = path.extname(originalFilename);
  return `${timestamp}-${randomSuffix}${ext}`;
};

/**
 * 生成文件访问URL
 * @param {string} subPath - 子路径（如 'images', 'labs', 'banners'）
 * @param {string} filename - 文件名
 * @return {string} 完整的访问URL
 */
const generateFileUrl = (subPath, filename) => {
  const protocol = process.env.SERVET_AGREEMENT || 'http';
  const host = process.env.SERVET_HOST || 'localhost';
  const port = process.env.SERVET_PORT || '7001';
  const staticPrefix = process.env.SERVET_FILE_STATIC || '/static';

  const baseUrl = `${protocol}://${host}:${port}`;
  return `${baseUrl}${staticPrefix}/uploads/${subPath}/${filename}`;
};

/**
 * 删除文件
 * @param {string} fileUrl - 文件URL
 * @return {boolean} 是否删除成功
 */
const deleteFile = (fileUrl) => {
  try {
    const staticPrefix = process.env.SERVET_FILE_STATIC || '/static';
    const urlParts = fileUrl.split(`${staticPrefix}/`);

    if (urlParts.length > 1) {
      const relativePath = urlParts[1];
      const filePath = path.join(process.cwd(), 'app/public', relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.warn('删除文件失败:', error.message);
    return false;
  }
};

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * 验证文件类型
 * @param {string} mimeType - 文件MIME类型
 * @param {string[]} allowedTypes - 允许的类型数组
 * @return {boolean} 是否允许
 */
const validateFileType = (mimeType, allowedTypes) => {
  return allowedTypes.includes(mimeType);
};

/**
 * 保存上传的文件
 * @param {Stream} stream - 文件流
 * @param {Object} options - 配置选项
 * @param {string} options.subPath - 子路径（如 'images', 'labs'）
 * @param {string} options.originalFilename - 原始文件名
 * @param {string} options.mimeType - 文件MIME类型
 * @param {string[]} options.allowedTypes - 允许的类型数组
 * @param {number} options.maxSize - 最大文件大小（字节）
 * @return {Promise<Object>} 包含文件信息的对象
 */
const saveFile = async (stream, options) => {
  const {
    subPath,
    originalFilename,
    mimeType,
    allowedTypes = [...ALLOWED_IMAGE_TYPES],
    maxSize = 5 * 1024 * 1024, // 默认5MB
  } = options;

  // 验证文件类型
  if (!validateFileType(mimeType, allowedTypes)) {
    throw new Error(`不支持的文件类型: ${mimeType}`);
  }

  // 生成文件名和路径
  const filename = generateFileName(originalFilename);
  const uploadDir = path.join(process.cwd(), 'app/public/uploads', subPath);
  const filePath = path.join(uploadDir, filename);

  // 确保目录存在
  ensureDirectoryExists(uploadDir);

  // 保存文件（使用 stream pipeline 更安全）
  const writeStream = createWriteStream(filePath);

  let fileSize = 0;
  stream.on('data', chunk => {
    fileSize += chunk.length;
    if (fileSize > maxSize) {
      stream.destroy();
      writeStream.destroy();
      throw new Error(`文件大小超过限制: ${maxSize} 字节`);
    }
  });

  await pipeline(stream, writeStream);

  // 生成访问URL
  const url = generateFileUrl(subPath, filename);

  return {
    filename,
    url,
    path: filePath,
    size: fileSize,
    mimeType,
  };
};

/**
 * 保存多个文件
 * @param {Array} files - 文件数组（来自 ctx.request.files）
 * @param {Object} options - 配置选项
 * @return {Promise<Array>} 文件信息数组
 */
const saveMultipleFiles = async (files, options) => {
  const results = [];

  for (const file of files) {
    const fileInfo = await saveFile(file, {
      ...options,
      originalFilename: file.filename,
      mimeType: file.mimeType || file.mime,
    });
    results.push(fileInfo);
  }

  return results;
};

/**
 * 上传配置生成器
 */
const createUploadConfig = (options = {}) => {
  const {
    subPath = 'files',
    allowedTypes = [...ALLOWED_IMAGE_TYPES],
    maxSize = 5 * 1024 * 1024,
    maxFiles = 10,
  } = options;

  return {
    subPath,
    allowedTypes,
    maxSize,
    maxFiles,
  };
};

// 预定义配置
const imageUploadConfig = createUploadConfig({
  subPath: 'images',
  allowedTypes: ALLOWED_IMAGE_TYPES,
  maxSize: 5 * 1024 * 1024, // 5MB
});

const documentUploadConfig = createUploadConfig({
  subPath: 'documents',
  allowedTypes: [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_EXCEL_TYPES],
  maxSize: 10 * 1024 * 1024, // 10MB
});

const generalUploadConfig = createUploadConfig({
  subPath: 'files',
  allowedTypes: [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
    ...ALLOWED_EXCEL_TYPES,
  ],
  maxSize: 10 * 1024 * 1024, // 10MB
});

module.exports = {
  // 工具函数
  generateFileName,
  generateFileUrl,
  deleteFile,
  ensureDirectoryExists,
  validateFileType,
  saveFile,
  saveMultipleFiles,

  // 配置生成器
  createUploadConfig,

  // 预定义配置
  imageUploadConfig,
  documentUploadConfig,
  generalUploadConfig,

  // 常量
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_EXCEL_TYPES,
};
