import axios, { AxiosInstance } from 'axios';
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
}

class ComprehensiveAPITester {
  private client: AxiosInstance;
  private baseUrl: string;
  private results: TestResult[] = [];
  private authToken: string = '';
  private createdLabId?: number;
  private createdNewsId?: number;
  private createdInstrumentId?: number;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
      validateStatus: () => true,
    });

    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  private async testEndpoint(
    name: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    headers?: any,
    skipIfExists?: boolean,
  ): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.request({
        method,
        url,
        data,
        headers,
      });

      const responseTime = Date.now() - start;
      const status = response.status >= 200 && response.status < 300 ? 'PASS' : 'FAIL';

      const result: TestResult = {
        endpoint: `${method} ${url}`,
        method,
        status,
        statusCode: response.status,
        responseTime,
      };

      if (status === 'FAIL') {
        result.error = `Status ${response.status}: ${JSON.stringify(response.data).substring(0, 300)}`;
        if (response.status === 409) {
          result.status = 'SKIP' as const;
          result.note = '已存在，跳过';
        }
      }

      const statusSymbol = status === 'PASS' ? '✓' : (result.status === 'SKIP' ? '⊘' : '✗');
      console.log(`${statusSymbol} ${name}: ${response.status} (${responseTime}ms)${result.note ? ' - ' + result.note : ''}`);

      return result;
    } catch (error: any) {
      const responseTime = Date.now() - start;
      const result: TestResult = {
        endpoint: `${method} ${url}`,
        method,
        status: 'FAIL',
        responseTime,
        error: error.message,
      };
      console.log(`✗ ${name}: ERROR - ${error.message}`);
      return result;
    }
  }

  private async authenticate(): Promise<boolean> {
    try {
      console.log('\n=== 用户认证 ===');
      const username = `user${Date.now()}`;
      const registerResponse = await this.client.post('/auth/register', {
        username,
        password: 'Test123456',
        confirmPassword: 'Test123456',
        role: 'STUDENT',
        email: 'test@example.com',
        phone: '13800000000',
      });

      if (registerResponse.status === 201 || registerResponse.status === 200) {
        console.log('✓ 用户注册成功');
      } else if (registerResponse.status === 409) {
        console.log('⊘ 用户已存在，尝试登录');
      } else {
        console.log('✗ 用户注册失败:', registerResponse.data);
        return false;
      }

      const loginResponse = await this.client.post('/auth/login', {
        username,
        password: 'Test123456',
      });

      if ((loginResponse.status === 200 || loginResponse.status === 201) && loginResponse.data?.data?.token) {
        this.authToken = loginResponse.data.data.token;
        console.log('✓ 用户登录成功');
        return true;
      }

      console.log('✗ 认证失败:', loginResponse.data);
      return false;
    } catch (error: any) {
      console.log('✗ 认证过程出错:', error.message);
      return false;
    }
  }

  private async createTestData(): Promise<void> {
    console.log('\n=== 创建测试数据 ===');

    // 创建实验室
    const labResponse = await this.client.post('/labs', {
      name: '测试实验室',
      location: '测试地点',
      capacity: 30,
      description: '这是一个测试实验室',
    });
    if (labResponse.status === 201 || labResponse.status === 200) {
      this.createdLabId = labResponse.data?.data?.id || 1;
      console.log(`✓ 创建实验室成功 (ID: ${this.createdLabId})`);
    } else if (labResponse.status === 409) {
      this.createdLabId = 1;
      console.log('⊘ 实验室已存在');
    }

    // 创建新闻
    const newsResponse = await this.client.post('/news', {
      title: '测试新闻',
      content: '这是测试新闻内容，用于API测试',
    });
    if (newsResponse.status === 201 || newsResponse.status === 200) {
      this.createdNewsId = newsResponse.data?.data?.id || 1;
      console.log(`✓ 创建新闻成功 (ID: ${this.createdNewsId})`);
    } else if (newsResponse.status === 409) {
      this.createdNewsId = 1;
      console.log('⊘ 新闻已存在');
    } else {
      console.log('⚠ 创建新闻失败，可能需要先创建实验室');
    }

    // 创建仪器
    if (this.createdLabId) {
      const instrumentResponse = await this.client.post('/instruments', {
        name: '测试仪器',
        model: 'T100',
        manufacturer: '测试厂商',
        labId: this.createdLabId,
        description: '这是一个测试仪器',
      });
      if (instrumentResponse.status === 201 || instrumentResponse.status === 200) {
        this.createdInstrumentId = instrumentResponse.data?.data?.id || 1;
        console.log(`✓ 创建仪器成功 (ID: ${this.createdInstrumentId})`);
      } else if (instrumentResponse.status === 409) {
        this.createdInstrumentId = 1;
        console.log('⊘ 仪器已存在');
      }
    }
  }

  async runAllTests(): Promise<void> {
    console.log('=== 完整API测试开始 ===\n');

    // 1. 认证
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log('\n⚠ 认证失败，测试终止');
      this.generateReport();
      return;
    }

    // 2. 创建测试数据
    await this.createTestData();

    // 3. 公共接口测试
    console.log('\n=== 公共接口测试 ===');
    this.results.push(
      await this.testEndpoint('获取实验室列表', 'GET', '/labs'),
      await this.testEndpoint('获取热门实验室', 'GET', '/labs/popular?limit=5'),
      await this.testEndpoint('获取仪器列表', 'GET', '/instruments'),
      await this.testEndpoint('获取新闻列表', 'GET', '/news'),
      await this.testEndpoint('获取预约列表', 'GET', '/appointments'),
    );

    // 4. 需要认证的基础查询
    console.log('\n=== 基础查询测试 ===');
    this.results.push(
      await this.testEndpoint('获取当前用户信息', 'GET', '/user/profile'),
      await this.testEndpoint('获取所有用户', 'GET', '/user'),
      await this.testEndpoint('获取我的预约', 'GET', '/appointments/my'),
      await this.testEndpoint('获取我的通知', 'GET', '/notifications'),
      await this.testEndpoint('获取未读通知数量', 'GET', '/notifications/unread-count'),
      await this.testEndpoint('获取我的收藏', 'GET', '/favorites'),
    );

    // 5. 创建操作测试
    console.log('\n=== 创建操作测试 ===');

    // 创建预约
    if (this.createdLabId) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.results.push(
        await this.testEndpoint('创建预约', 'POST', '/appointments', {
          labId: this.createdLabId,
          date: tomorrow.toISOString().split('T')[0],
          timeSlot: 0,
          purpose: '测试预约',
          description: '这是一个测试预约',
          participantCount: 2,
        })
      );
    }

    // 创建评价
    if (this.createdLabId) {
      this.results.push(
        await this.testEndpoint('提交评价', 'POST', '/evaluations', {
          labId: this.createdLabId,
          overallRating: 5,
          equipmentRating: 4,
          environmentRating: 5,
          serviceRating: 4,
          comment: '测试评价',
        })
      );
    }

    // 添加收藏
    if (this.createdLabId) {
      this.results.push(
        await this.testEndpoint('添加收藏', 'POST', `/favorites/${this.createdLabId}`, {}),
        await this.testEndpoint('检查是否收藏', 'GET', `/favorites/${this.createdLabId}/check`, {})
      );
    }

    // 点赞新闻
    if (this.createdNewsId) {
      this.results.push(
        await this.testEndpoint('点赞新闻', 'POST', `/news/${this.createdNewsId}/like`, {})
      );
    }

    // 6. 更新操作测试
    console.log('\n=== 更新操作测试 ===');
    this.results.push(
      await this.testEndpoint('标记所有通知为已读', 'PATCH', '/notifications/read-all', {}),
    );

    // 7. 删除操作测试
    console.log('\n=== 删除操作测试 ===');
    if (this.createdLabId) {
      this.results.push(
        await this.testEndpoint('取消收藏', 'DELETE', `/favorites/${this.createdLabId}`, {}),
      );
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

    console.log('\n' + '='.repeat(50));
    console.log('=== 测试完成 ===');
    console.log('='.repeat(50));
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed} ✓`);
    console.log(`失败: ${failed} ✗`);
    console.log(`跳过: ${skipped} ⊘`);
    console.log(`通过率(不含跳过): ${passRate}%`);
    console.log('='.repeat(50) + '\n');

    // 生成详细报告文件
    const reportPath = path.join(process.cwd(), 'comprehensive-test-report.txt');
    const report = [
      '=== 完整API测试报告 ===',
      `测试时间: ${new Date().toLocaleString()}`,
      `服务器地址: ${this.baseUrl}`,
      '',
      '=== 总结 ===',
      `总测试数: ${total}`,
      `通过: ${passed}`,
      `失败: ${failed}`,
      `跳过: ${skipped}`,
      `通过率(不含跳过): ${passRate}%`,
      '',
      '=== 详细结果 ===',
      ...this.results.map((r) => {
        const status = r.status === 'PASS' ? '✓ PASS' : r.status === 'SKIP' ? '⊘ SKIP' : '✗ FAIL';
        const time = r.responseTime ? ` (${r.responseTime}ms)` : '';
        const note = r.note ? ` - ${r.note}` : '';
        const error = r.error ? `\n    Error: ${r.error}` : '';
        return `${status} ${r.endpoint}${time}${note}${error}`;
      }),
      '',
      '=== 失败详情 ===',
      ...this.results
        .filter((r) => r.status === 'FAIL')
        .map((r) => {
          return [
            `端点: ${r.endpoint}`,
            `状态码: ${r.statusCode}`,
            `错误: ${r.error}`,
            '',
          ].join('\n');
        }),
    ].join('\n');

    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`详细报告已保存到: ${reportPath}`);

    if (failed > 0) {
      console.log('\n=== 失败的测试 ===');
      this.results
        .filter((r) => r.status === 'FAIL')
        .forEach((r) => {
          console.log(`✗ ${r.endpoint}`);
          console.log(`  状态码: ${r.statusCode}`);
          console.log(`  错误: ${r.error}\n`);
        });
    }
  }
}

// 运行测试
const tester = new ComprehensiveAPITester();
tester.runAllTests().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
