import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  error?: string;
  responseTime?: number;
  note?: string;
  requestData?: any;
  responseData?: any;
}

interface TestStep {
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  headers?: any;
  skipIfExists?: boolean;
  requiresAuth?: boolean;
  description?: string;
}

class ComprehensiveAPITester {
  private client: AxiosInstance;
  private baseUrl: string;
  private results: TestResult[] = [];
  private authToken: string = '';
  private createdUserId?: number;
  private createdLabId?: number;
  private createdNewsId?: number;
  private createdInstrumentId?: number;
  private createdAppointmentId?: number;
  private createdNotificationId?: number;
  private testLogs: string[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 20000,
      validateStatus: () => true,
    });

    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      config.headers['Content-Type'] = 'application/json';
      return config;
    });
  }

  private log(message: string, level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING' = 'INFO'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    this.testLogs.push(logMessage);
  }

  private async testEndpoint(
    step: TestStep,
  ): Promise<TestResult> {
    const start = Date.now();
    this.log(`开始测试: ${step.name} - ${step.method} ${step.url}`, 'INFO');
    if (step.data) {
      this.log(`请求数据: ${JSON.stringify(step.data, null, 2)}`, 'INFO');
    }

    try {
      const response: AxiosResponse = await this.client.request({
        method: step.method,
        url: step.url,
        data: step.data,
        headers: step.headers,
      });

      const responseTime = Date.now() - start;
      const status = response.status >= 200 && response.status < 300 ? 'PASS' : 'FAIL';

      const result: TestResult = {
        endpoint: `${step.method} ${step.url}`,
        method: step.method,
        status,
        statusCode: response.status,
        responseTime,
        requestData: step.data,
        responseData: response.data,
      };

      if (status === 'FAIL') {
        result.error = `Status ${response.status}: ${JSON.stringify(response.data).substring(0, 500)}`;
        if (response.status === 409) {
          result.status = 'SKIP' as const;
          result.note = '已存在，跳过';
        }
      }

      const statusSymbol = status === 'PASS' ? '✓' : (result.status === 'SKIP' ? '⊘' : '✗');
      const level = status === 'PASS' ? 'SUCCESS' : (result.status === 'SKIP' ? 'WARNING' : 'ERROR');
      this.log(`${statusSymbol} ${step.name}: ${response.status} (${responseTime}ms)${result.note ? ' - ' + result.note : ''}`, level);
      this.log(`响应数据: ${JSON.stringify(response.data, null, 2)}`, 'INFO');

      return result;
    } catch (error: any) {
      const responseTime = Date.now() - start;
      const result: TestResult = {
        endpoint: `${step.method} ${step.url}`,
        method: step.method,
        status: 'FAIL',
        responseTime,
        error: error.message,
        requestData: step.data,
      };
      this.log(`✗ ${step.name}: ERROR - ${error.message}`, 'ERROR');
      return result;
    }
  }

  private async authenticate(): Promise<boolean> {
    try {
      this.log('\n=== 用户认证 ===', 'INFO');
      const timestamp = Date.now().toString().slice(-6);
      const username = `user${timestamp}`;
      const email = `test${timestamp}@example.com`;
      const phone = `138${timestamp}0000`.substring(0, 11);

      // 1. 注册用户
      const registerResponse = await this.client.post('/auth/register', {
        username,
        password: 'Test123456',
        confirmPassword: 'Test123456',
        role: 'STUDENT',
        email,
        phone,
      });

      this.log(`注册响应: ${registerResponse.status} - ${JSON.stringify(registerResponse.data)}`, 'INFO');

      if (registerResponse.status === 201 || registerResponse.status === 200) {
        this.log('✓ 用户注册成功', 'SUCCESS');
        this.createdUserId = registerResponse.data?.data?.id;
      } else if (registerResponse.status === 409) {
        this.log('⊘ 用户已存在，尝试登录', 'WARNING');
      } else {
        this.log('✗ 用户注册失败', 'ERROR');
        return false;
      }

      // 2. 登录获取token
      const loginResponse = await this.client.post('/auth/login', {
        username,
        password: 'Test123456',
      });

      this.log(`登录响应: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`, 'INFO');

      if ((loginResponse.status === 200 || loginResponse.status === 201) && loginResponse.data?.data?.token) {
        this.authToken = loginResponse.data.data.token;
        this.log('✓ 用户登录成功，获取到Token', 'SUCCESS');
        this.log(`Token: ${this.authToken.substring(0, 50)}...`, 'INFO');
        return true;
      }

      this.log('✗ 登录失败: ' + JSON.stringify(loginResponse.data), 'ERROR');
      return false;
    } catch (error: any) {
      this.log('✗ 认证过程出错: ' + error.message, 'ERROR');
      return false;
    }
  }

  private async createTestData(): Promise<void> {
    this.log('\n=== 创建测试数据 ===', 'INFO');

    // 1. 创建实验室
    const labResponse = await this.client.post('/labs', {
      name: '测试实验室',
      location: '测试地点A楼101',
      capacity: 30,
      description: '这是一个用于API测试的实验室',
      department: '计算机科学系',
    });
    
    this.log(`创建实验室响应: ${labResponse.status} - ${JSON.stringify(labResponse.data)}`, 'INFO');
    
    if (labResponse.status === 201 || labResponse.status === 200) {
      this.createdLabId = labResponse.data?.data?.id || 1;
      this.log(`✓ 创建实验室成功 (ID: ${this.createdLabId})`, 'SUCCESS');
    } else if (labResponse.status === 409) {
      this.createdLabId = 1;
      this.log('⊘ 实验室已存在，使用ID: 1', 'WARNING');
    } else {
      this.log('⚠ 创建实验室失败，可能影响后续测试', 'WARNING');
    }

    // 2. 创建新闻
    const newsResponse = await this.client.post('/news', {
      title: '测试新闻标题',
      content: '这是测试新闻的详细内容，用于验证新闻API功能',
      category: '通知',
    });
    
    this.log(`创建新闻响应: ${newsResponse.status} - ${JSON.stringify(newsResponse.data)}`, 'INFO');
    
    if (newsResponse.status === 201 || newsResponse.status === 200) {
      this.createdNewsId = newsResponse.data?.data?.id || 1;
      this.log(`✓ 创建新闻成功 (ID: ${this.createdNewsId})`, 'SUCCESS');
    } else if (newsResponse.status === 409) {
      this.createdNewsId = 1;
      this.log('⊘ 新闻已存在，使用ID: 1', 'WARNING');
    } else {
      this.log('⚠ 创建新闻失败，可能需要先创建实验室', 'WARNING');
    }

    // 3. 创建仪器
    if (this.createdLabId) {
      const instrumentResponse = await this.client.post('/instruments', {
        name: '测试仪器设备',
        model: 'TEST-2024',
        manufacturer: '测试厂商有限公司',
        labId: this.createdLabId,
        description: '这是一个用于API测试的仪器设备',
        specifications: '高精度测试设备',
      });
      
      this.log(`创建仪器响应: ${instrumentResponse.status} - ${JSON.stringify(instrumentResponse.data)}`, 'INFO');
      
      if (instrumentResponse.status === 201 || instrumentResponse.status === 200) {
        this.createdInstrumentId = instrumentResponse.data?.data?.id || 1;
        this.log(`✓ 创建仪器成功 (ID: ${this.createdInstrumentId})`, 'SUCCESS');
      } else if (instrumentResponse.status === 409) {
        this.createdInstrumentId = 1;
        this.log('⊘ 仪器已存在，使用ID: 1', 'WARNING');
      }
    }
  }

  private getAllTestSteps(): TestStep[] {
    const steps: TestStep[] = [];

    // === 1. 认证模块测试 ===
    this.log('准备认证模块测试步骤', 'INFO');
    
    // 公共接口测试（无需认证）
    steps.push(
      {
        name: '获取实验室列表(公共)',
        method: 'GET',
        url: '/labs',
        description: '测试公共接口 - 获取实验室列表',
        requiresAuth: false,
      },
      {
        name: '获取热门实验室(公共)',
        method: 'GET',
        url: '/labs/popular?limit=5',
        description: '测试公共接口 - 获取热门实验室',
        requiresAuth: false,
      },
      {
        name: '获取仪器列表(公共)',
        method: 'GET',
        url: '/instruments',
        description: '测试公共接口 - 获取仪器列表',
        requiresAuth: false,
      },
      {
        name: '获取新闻列表(公共)',
        method: 'GET',
        url: '/news',
        description: '测试公共接口 - 获取新闻列表',
        requiresAuth: false,
      },
      {
        name: '获取预约列表(公共)',
        method: 'GET',
        url: '/appointments',
        description: '测试公共接口 - 获取预约列表',
        requiresAuth: false,
      }
    );

    // === 2. 基础用户查询测试（需要认证）===
    steps.push(
      {
        name: '获取当前用户信息',
        method: 'GET',
        url: '/user/profile',
        description: '获取当前用户详细信息',
        requiresAuth: true,
      },
      {
        name: '获取所有用户',
        method: 'GET',
        url: '/user',
        description: '获取所有用户列表',
        requiresAuth: true,
      },
      {
        name: '获取我的预约',
        method: 'GET',
        url: '/appointments/my',
        description: '获取当前用户的预约记录',
        requiresAuth: true,
      },
      {
        name: '获取我的通知',
        method: 'GET',
        url: '/notifications',
        description: '获取当前用户的通知列表',
        requiresAuth: true,
      },
      {
        name: '获取未读通知数量',
        method: 'GET',
        url: '/notifications/unread-count',
        description: '获取未读通知数量',
        requiresAuth: true,
      },
      {
        name: '获取我的收藏',
        method: 'GET',
        url: '/favorites',
        description: '获取用户收藏列表',
        requiresAuth: true,
      }
    );

    // === 3. 创建操作测试 ===
    // 创建预约
    if (this.createdLabId) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      steps.push({
        name: '创建预约',
        method: 'POST',
        url: '/appointments',
        data: {
          labId: this.createdLabId,
          appointmentDate: tomorrow,
          timeSlot: 0,
          purpose: 'API测试预约',
          description: '这是一个用于验证API功能的测试预约',
          participantCount: 2,
        },
        description: '创建新的实验室预约',
        requiresAuth: true,
      });
    }

    // 申请使用仪器
    if (this.createdInstrumentId) {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(Date.now() + 26 * 60 * 60 * 1000);
      steps.push({
        name: '申请使用仪器',
        method: 'POST',
        url: `/instruments/${this.createdInstrumentId}/apply`,
        data: {
          purpose: 'API测试使用',
          startTime: startTime,
          endTime: endTime,
          description: '这是一个完整的API测试仪器使用申请，包含了详细的实验目的和操作说明，满足系统要求的50个字符最小长度限制，用于验证仪器申请接口的完整功能',
        },
        description: '申请使用指定仪器',
        requiresAuth: true,
      });
    }

    // 提交评价
    if (this.createdLabId) {
      steps.push({
        name: '提交实验室评价',
        method: 'POST',
        url: '/evaluations',
        data: {
          labId: this.createdLabId,
          overallRating: 5,
          equipmentRating: 4,
          environmentRating: 5,
          serviceRating: 4,
          comment: '这是一个API测试评价，实验室功能正常',
        },
        description: '对实验室进行评价',
        requiresAuth: true,
      });
    }

    // 添加收藏
    if (this.createdLabId) {
      steps.push(
        {
          name: '添加收藏',
          method: 'POST',
          url: `/favorites/${this.createdLabId}`,
          data: {},
          description: '将实验室添加到收藏',
          requiresAuth: true,
        },
        {
          name: '检查是否收藏',
          method: 'GET',
          url: `/favorites/${this.createdLabId}/check`,
          description: '检查实验室是否已收藏',
          requiresAuth: true,
        }
      );
    }

    // 点赞新闻
    if (this.createdNewsId) {
      steps.push({
        name: '点赞新闻',
        method: 'POST',
        url: `/news/${this.createdNewsId}/like`,
        data: {},
        description: '点赞指定新闻',
        requiresAuth: true,
      });
    }

    // === 4. 更新操作测试 ===
    steps.push(
      {
        name: '标记所有通知为已读',
        method: 'PATCH',
        url: '/notifications/read-all',
        data: {},
        description: '将所有未读通知标记为已读',
        requiresAuth: true,
      }
    );

    // === 5. 查询操作测试 ===
    // 实验室相关查询
    if (this.createdLabId) {
      steps.push(
        {
          name: '获取实验室详情',
          method: 'GET',
          url: `/labs/${this.createdLabId}`,
          description: '获取指定实验室详细信息',
          requiresAuth: false,
        }
      );
    }

    // 仪器相关查询
    if (this.createdInstrumentId) {
      steps.push(
        {
          name: '获取仪器详情',
          method: 'GET',
          url: `/instruments/${this.createdInstrumentId}`,
          description: '获取指定仪器详细信息',
          requiresAuth: false,
        },
        {
          name: '获取仪器申请列表',
          method: 'GET',
          url: '/instruments/applications',
          description: '获取仪器使用申请列表',
          requiresAuth: true,
        },
        {
          name: '获取维修记录',
          method: 'GET',
          url: '/instruments/repairs',
          description: '获取仪器维修记录',
          requiresAuth: true,
        }
      );
    }

    // 新闻相关查询
    if (this.createdNewsId) {
      steps.push({
        name: '获取新闻详情',
        method: 'GET',
        url: `/news/${this.createdNewsId}`,
        description: '获取指定新闻详细信息',
        requiresAuth: false,
      });
    }

    // 预约相关查询
    steps.push(
      {
        name: '获取待审核预约',
        method: 'GET',
        url: '/appointments/pending',
        description: '获取待审核的预约列表',
        requiresAuth: true,
      },
      {
        name: '获取预约详情',
        method: 'GET',
        url: '/appointments/1',
        description: '获取指定预约详细信息',
        requiresAuth: false,
      }
    );

    // 评价相关查询
    if (this.createdLabId) {
      steps.push(
        {
          name: '获取实验室评价',
          method: 'GET',
          url: `/evaluations/lab/${this.createdLabId}`,
          description: '获取指定实验室的所有评价',
          requiresAuth: false,
        },
        {
          name: '获取实验室评价统计',
          method: 'GET',
          url: `/evaluations/lab/${this.createdLabId}/statistics`,
          description: '获取实验室评价统计数据',
          requiresAuth: false,
        }
      );
    }

    // === 6. 删除操作测试 ===
    if (this.createdLabId) {
      steps.push({
        name: '取消收藏',
        method: 'DELETE',
        url: `/favorites/${this.createdLabId}`,
        description: '从收藏中移除实验室',
        requiresAuth: true,
      });
    }

    // === 7. 特定功能测试 ===
    steps.push(
      {
        name: '获取用户详情',
        method: 'GET',
        url: '/user/1',
        description: '获取指定用户详细信息',
        requiresAuth: true,
      },
      {
        name: '搜索实验室',
        method: 'GET',
        url: '/labs?keyword=测试',
        description: '搜索包含关键词的实验室',
        requiresAuth: false,
      },
      {
        name: '搜索仪器',
        method: 'GET',
        url: '/instruments?keyword=测试',
        description: '搜索包含关键词的仪器',
        requiresAuth: false,
      },
      {
        name: '按实验室查询仪器',
        method: 'GET',
        url: `/instruments?labId=${this.createdLabId || 1}`,
        description: '查询指定实验室的仪器',
        requiresAuth: false,
      }
    );

    this.log(`总共准备了 ${steps.length} 个测试步骤`, 'INFO');
    return steps;
  }

  async runAllTests(): Promise<void> {
    this.log('=== 开始完整API测试 ===', 'INFO');
    this.log(`测试服务器: ${this.baseUrl}`, 'INFO');
    this.log(`测试时间: ${new Date().toLocaleString()}`, 'INFO');

    // 1. 认证
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      this.log('⚠ 认证失败，测试终止', 'ERROR');
      this.generateReport();
      return;
    }

    // 2. 创建测试数据
    await this.createTestData();

    // 3. 获取所有测试步骤
    const allSteps = this.getAllTestSteps();

    // 4. 执行测试
    this.log('\n=== 开始执行API测试 ===', 'INFO');
    
    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i];
      this.log(`\n执行测试 ${i + 1}/${allSteps.length}: ${step.name}`, 'INFO');
      
      // 如果步骤需要认证但没有token，跳过
      if (step.requiresAuth && !this.authToken) {
        this.log(`⊘ 跳过 ${step.name}: 缺少认证token`, 'WARNING');
        this.results.push({
          endpoint: `${step.method} ${step.url}`,
          method: step.method,
          status: 'SKIP',
          note: '缺少认证token',
        });
        continue;
      }

      const result = await this.testEndpoint(step);
      this.results.push(result);
    }

    // 生成报告
    this.generateReport();
  }

  private generateReport(): void {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const failed = this.results.filter((r) => r.status === 'FAIL').length;
    const skipped = this.results.filter((r) => r.status === 'SKIP').length;
    const passRate = total > 0 ? ((passed / (total - skipped)) * 100).toFixed(2) : '0';

    // 控制台输出总结
    this.log('\n' + '='.repeat(60), 'INFO');
    this.log('=== API测试完成 ===', 'INFO');
    this.log('='.repeat(60), 'INFO');
    this.log(`总测试数: ${total}`, 'INFO');
    this.log(`通过: ${passed} ✓`, passed > 0 ? 'SUCCESS' : 'INFO');
    this.log(`失败: ${failed} ✗`, failed > 0 ? 'ERROR' : 'INFO');
    this.log(`跳过: ${skipped} ⊘`, 'WARNING');
    this.log(`通过率(不含跳过): ${passRate}%`, passRate === '100.00' ? 'SUCCESS' : 'WARNING');
    this.log('='.repeat(60), 'INFO');

    // 生成详细报告文件
    const reportPath = path.join(process.cwd(), 'api-test-detailed-log.txt');
    const report = [
      '=== 详细API测试报告 ===',
      `测试时间: ${new Date().toLocaleString()}`,
      `服务器地址: ${this.baseUrl}`,
      '',
      '=== 测试日志 ===',
      ...this.testLogs,
      '',
      '=== 测试总结 ===',
      `总测试数: ${total}`,
      `通过: ${passed}`,
      `失败: ${failed}`,
      `跳过: ${skipped}`,
      `通过率(不含跳过): ${passRate}%`,
      '',
      '=== 详细测试结果 ===',
      ...this.results.map((r, index) => {
        const status = r.status === 'PASS' ? '✓ PASS' : r.status === 'SKIP' ? '⊘ SKIP' : '✗ FAIL';
        const time = r.responseTime ? ` (${r.responseTime}ms)` : '';
        const note = r.note ? ` - ${r.note}` : '';
        const error = r.error ? `\n    错误: ${r.error}` : '';
        const request = r.requestData ? `\n    请求数据: ${JSON.stringify(r.requestData, null, 4)}` : '';
        const response = r.responseData ? `\n    响应数据: ${JSON.stringify(r.responseData, null, 4)}` : '';
        
        return [
          `${index + 1}. ${status} ${r.endpoint}${time}${note}`,
          `    状态码: ${r.statusCode}`,
          `${error}${request}${response}`,
        ].join('\n');
      }),
      '',
      '=== 失败的测试详情 ===',
      ...this.results
        .filter((r) => r.status === 'FAIL')
        .map((r, index) => {
          return [
            `${index + 1}. 端点: ${r.endpoint}`,
            `   状态码: ${r.statusCode}`,
            `   错误: ${r.error}`,
            `   请求数据: ${JSON.stringify(r.requestData, null, 4)}`,
            `   响应数据: ${JSON.stringify(r.responseData, null, 4)}`,
            '',
          ].join('\n');
        }),
    ].join('\n');

    fs.writeFileSync(reportPath, report, 'utf-8');
    this.log(`\n详细测试报告已保存到: ${reportPath}`, 'SUCCESS');

    // 显示失败的测试
    if (failed > 0) {
      this.log('\n=== 失败的测试 ===', 'ERROR');
      this.results
        .filter((r) => r.status === 'FAIL')
        .forEach((r, index) => {
          this.log(`${index + 1}. ✗ ${r.endpoint}`, 'ERROR');
          this.log(`   状态码: ${r.statusCode}`, 'ERROR');
          this.log(`   错误: ${r.error}`, 'ERROR');
        });
    }

    this.log(`\n测试完成！共 ${total} 个测试，通过 ${passed} 个，失败 ${failed} 个，跳过 ${skipped} 个`, 
             failed === 0 ? 'SUCCESS' : 'WARNING');
  }
}

// 运行测试
async function main() {
  try {
    const tester = new ComprehensiveAPITester('http://localhost:3000');
    await tester.runAllTests();
  } catch (error) {
    console.error('测试运行失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default ComprehensiveAPITester;
