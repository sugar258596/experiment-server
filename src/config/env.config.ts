import * as fs from 'fs';

export function loadConfig() {
  const environment = process.env.NODE_ENV || 'development';

  // 配置文件优先级 (从高到低)
  const configFiles = [
    `.env.${environment}.local`,
    `.env.local`,
    `.env.${environment}`,
    '.env',
  ];

  let mergedConfig: Record<string, string> = {};

  // 按优先级逆序加载,让高优先级的配置覆盖低优先级的
  configFiles.reverse().forEach((file) => {
    const config = parseEnvFile(file);
    if (Object.keys(config).length > 0) {
      mergedConfig = { ...mergedConfig, ...config };
    }
  });

  return mergedConfig;
}

function parseEnvFile(filePath: string): Record<string, string> {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const envConfig = fs.readFileSync(filePath, 'utf-8');
    const config: Record<string, string> = {};

    envConfig.split('\n').forEach((line, index) => {
      // 移除注释和空行
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }

      // 支持等号在值中的情况
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        return;
      }

      const key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();

      if (!key) {
        return;
      }

      // 移除值两端的引号
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // 处理特殊值类型
      if (value === 'true') {
        config[key] = 'true';
      } else if (value === 'false') {
        config[key] = 'false';
      } else if (/^\d+$/.test(value)) {
        config[key] = value;
      } else {
        config[key] = value;
      }
    });

    return config;
  } catch (error) {
    console.warn(`Failed to parse env file: ${filePath}`, error.message);
    return {};
  }
}
