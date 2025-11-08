import axios, { AxiosInstance, AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface TestLog {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  data?: unknown;
  error?: string;
  duration: number;
}

interface BugReport {
  timestamp: string;
  method: string;
  url: string;
  error: string;
  statusCode?: number;
  response?: unknown;
  requestData?: unknown;
}

class APITester {
  private client: AxiosInstance;
  private logs: TestLog[] = [];
  private bugs: BugReport[] = [];
  private token = '';
  private baseURL = 'http://localhost:3000';

  private testUserId = 0;
  private testLabId = 0;
  private testInstrumentId = 0;
  private testAppointmentId = 0;
  private testNewsId = 0;
  private testNotificationId = 0;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      validateStatus: () => true,
    });
  }

  private log(
    method: string,
    url: string,
    status: number,
    duration: number,
    data?: unknown,
    error?: string,
  ) {
    const logEntry: TestLog = {
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      duration,
      data,
      error,
    };
    this.logs.push(logEntry);

    const statusColor = status >= 200 && status < 300 ? '\x1b[32m' : '\x1b[31m';
    console.log(
      `${statusColor}[${method}] ${url} - ${status} (${duration}ms)\x1b[0m`,
    );

    if (error) {
      console.error(`  Error: ${error}`);
    }
  }

  private reportBug(
    method: string,
    url: string,
    error: string,
    statusCode?: number,
    response?: unknown,
    requestData?: unknown,
  ) {
    const bug: BugReport = {
      timestamp: new Date().toISOString(),
      method,
      url,
      error,
      statusCode,
      response,
      requestData,
    };
    this.bugs.push(bug);
    console.error(`\x1b[31m[BUG] ${method} ${url}: ${error}\x1b[0m`);
  }

  private async request(
    method: string,
    url: string,
    data?: unknown,
    needAuth = false,
  ) {
    const startTime = Date.now();
    try {
      const headers: Record<string, string> = {};
      if (needAuth && this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await this.client.request({
        method,
        url,
        data,
        headers,
      });

      const duration = Date.now() - startTime;
      this.log(method, url, response.status, duration, response.data);

      if (response.status >= 400) {
        this.reportBug(
          method,
          url,
          `HTTP ${response.status}: ${JSON.stringify(response.data)}`,
          response.status,
          response.data,
          data,
        );
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.message || 'Unknown error';

      this.log(method, url, 0, duration, undefined, errorMessage);
      this.reportBug(
        method,
        url,
        errorMessage,
        axiosError.response?.status,
        axiosError.response?.data,
        data,
      );

      return null;
    }
  }

  async testAuthAPIs() {
    console.log('\n========== 测试认证接口 ==========\n');

    // 1. 注册新用户
    const timestamp = Date.now();
    const registerData = {
      username: `testuser${timestamp}`.substring(0, 20),
      password: 'Password123',
      confirmPassword: 'Password123',
      email: `test${timestamp}@example.com`,
      phone: '13800138000',
      role: 'STUDENT',
    };

    const registerRes = await this.request(
      'POST',
      '/auth/register',
      registerData,
    );

    if (registerRes && registerRes.status === 201) {
      console.log('✓ 注册成功');
    }

    // 2. 登录
    const loginData = {
      username: registerData.username,
      password: registerData.password,
    };

    const loginRes = await this.request('POST', '/auth/login', loginData);

    if (loginRes && (loginRes.status === 200 || loginRes.status === 201)) {
      const responseData = loginRes.data;
      if (
        responseData.data &&
        (responseData.data.access_token || responseData.data.token)
      ) {
        this.token = responseData.data.access_token || responseData.data.token;
        console.log('✓ 登录成功，获取到Token');
      } else {
        this.reportBug(
          'POST',
          '/auth/login',
          '登录响应格式错误，未找到access_token或token',
          loginRes.status,
          loginRes.data,
        );
      }
    }

    // 3. 测试错误登录
    await this.request('POST', '/auth/login', {
      username: 'nonexistent',
      password: 'wrongpassword',
    });
  }

  async testUserAPIs() {
    console.log('\n========== 测试用户接口 ==========\n');

    // 1. 获取当前用户信息
    const profileRes = await this.request('GET', '/user/profile', null, true);
    if (profileRes && profileRes.status === 200) {
      const userData = profileRes.data.data;
      if (userData && userData.id) {
        this.testUserId = userData.id;
        console.log(`✓ 获取用户信息成功，用户ID: ${this.testUserId}`);
      }
    }

    // 2. 创建用户(需要管理员权限，可能失败)
    await this.request(
      'POST',
      '/user',
      {
        username: `admintest${Date.now()}`.substring(0, 20),
        password: 'Admin123456',
        email: `admin_${Date.now()}@example.com`,
        role: 'admin',
      },
      true,
    );

    // 3. 获取所有用户
    await this.request('GET', '/user', null, true);

    // 4. 获取单个用户详情
    if (this.testUserId) {
      await this.request('GET', `/user/${this.testUserId}`, null, true);
    }

    // 5. 更新用户信息
    if (this.testUserId) {
      await this.request(
        'PATCH',
        `/user/${this.testUserId}`,
        {
          nickname: '更新后的昵称',
          department: '软件学院',
        },
        true,
      );
    }
  }

  async testLabAPIs() {
    console.log('\n========== 测试实验室接口 ==========\n');

    // 1. 创建实验室
    const createLabData = {
      name: `测试实验室_${Date.now()}`,
      location: '实验楼A座101',
      capacity: 30,
      description: '这是一个测试实验室',
      equipment: '电脑30台，投影仪1台',
      openTime: '08:00-22:00',
      department: '计算机学院',
      status: 0, // 0: AVAILABLE, 1: OCCUPIED, 2: MAINTENANCE
    };

    const createLabRes = await this.request(
      'POST',
      '/labs',
      createLabData,
      true,
    );

    if (createLabRes && createLabRes.status === 201) {
      const labData = createLabRes.data.data;
      if (labData && labData.id) {
        this.testLabId = labData.id;
        console.log(`✓ 创建实验室成功，ID: ${this.testLabId}`);
      }
    }

    // 2. 获取所有实验室(公开接口)
    await this.request('GET', '/labs', null, false);

    // 3. 搜索实验室
    await this.request('GET', '/labs?keyword=测试', null, false);

    // 4. 获取热门实验室
    await this.request('GET', '/labs/popular?pagSize=6', null, false);

    // 5. 获取实验室详情
    if (this.testLabId) {
      await this.request('GET', `/labs/${this.testLabId}`, null, false);
    }

    // 6. 更新实验室信息
    if (this.testLabId) {
      await this.request(
        'PATCH',
        `/labs/${this.testLabId}`,
        {
          capacity: 35,
          description: '更新后的实验室描述',
        },
        true,
      );
    }
  }

  async testAppointmentAPIs() {
    console.log('\n========== 测试预约接口 ==========\n');

    // 确保有实验室ID
    if (!this.testLabId) {
      console.log('⚠ 跳过预约测试:没有可用的实验室ID');
      return;
    }

    // 1. 创建预约
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const createAppointmentData = {
      labId: this.testLabId,
      appointmentDate: tomorrow.toISOString(),
      timeSlot: 0, // 0: MORNING, 1: AFTERNOON, 2: EVENING
      purpose: '进行实验测试',
      description: '这是一个详细的实验说明，需要使用实验室进行相关的测试工作',
      participantCount: 10,
    };

    const createRes = await this.request(
      'POST',
      '/appointments',
      createAppointmentData,
      true,
    );

    if (createRes && createRes.status === 201) {
      const appointmentData = createRes.data.data;
      if (appointmentData && appointmentData.id) {
        this.testAppointmentId = appointmentData.id;
        console.log(`✓ 创建预约成功，ID: ${this.testAppointmentId}`);
      }
    }

    // 2. 获取所有预约(公开)
    await this.request('GET', '/appointments', null, false);

    // 3. 获取我的预约
    await this.request('GET', '/appointments/my', null, true);

    // 4. 获取待审核预约
    await this.request('GET', '/appointments/pending', null, true);

    // 5. 获取预约详情
    if (this.testAppointmentId) {
      await this.request(
        'GET',
        `/appointments/${this.testAppointmentId}`,
        null,
        false,
      );
    }

    // 6. 审核预约(需要教师/管理员权限，可能失败)
    if (this.testAppointmentId) {
      await this.request(
        'PATCH',
        `/appointments/${this.testAppointmentId}/review`,
        {
          approved: true,
          comment: '审核通过',
        },
        true,
      );
    }

    // 7. 取消预约
    if (this.testAppointmentId) {
      await this.request(
        'PATCH',
        `/appointments/${this.testAppointmentId}/cancel`,
        null,
        true,
      );
    }
  }

  async testInstrumentAPIs() {
    console.log('\n========== 测试仪器接口 ==========\n');

    // 1. 创建仪器
    const createInstrumentData = {
      name: `测试仪器_${Date.now()}`,
      model: 'TEST-MODEL-001',
      manufacturer: '测试厂商',
      purchaseDate: new Date().toISOString().split('T')[0],
      price: 50000,
      status: 0, // 0: AVAILABLE, 1: IN_USE, 2: UNDER_REPAIR, 3: SCRAPPED
      specifications: '测试规格参数',
      labId: this.testLabId || 1,
    };

    const createRes = await this.request(
      'POST',
      '/instruments',
      createInstrumentData,
      true,
    );

    if (createRes && createRes.status === 201) {
      const instrumentData = createRes.data.data;
      if (instrumentData && instrumentData.id) {
        this.testInstrumentId = instrumentData.id;
        console.log(`✓ 创建仪器成功，ID: ${this.testInstrumentId}`);
      }
    }

    // 2. 获取所有仪器(公开)
    await this.request('GET', '/instruments', null, false);

    // 3. 搜索仪器
    await this.request('GET', '/instruments?keyword=测试', null, false);

    // 4. 按实验室筛选仪器
    if (this.testLabId) {
      await this.request(
        'GET',
        `/instruments?labId=${this.testLabId}`,
        null,
        false,
      );
    }

    // 5. 获取仪器详情
    if (this.testInstrumentId) {
      await this.request(
        'GET',
        `/instruments/${this.testInstrumentId}`,
        null,
        false,
      );
    }

    // 6. 申请使用仪器
    if (this.testInstrumentId) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await this.request(
        'POST',
        `/instruments/${this.testInstrumentId}/apply`,
        {
          startTime: tomorrow.toISOString(),
          endTime: new Date(
            tomorrow.getTime() + 2 * 60 * 60 * 1000,
          ).toISOString(),
          purpose: '测试使用仪器',
          description:
            '这是一个详细的使用说明，需要使用该仪器进行相关的科研测试工作，预计使用时长为2小时',
        },
        true,
      );
    }

    // 7. 获取使用申请列表
    await this.request('GET', '/instruments/applications', null, true);

    // 8. 报告仪器故障
    if (this.testInstrumentId) {
      await this.request(
        'POST',
        `/instruments/${this.testInstrumentId}/repair`,
        {
          instrumentId: this.testInstrumentId,
          faultType: 0, // 0: 机械故障, 1: 电路故障, 2: 软件故障, 3: 其他
          faultDescription:
            '测试故障报告，仪器在使用过程中发现一些问题需要进行维修和检查',
          urgency: 1, // 0: 低, 1: 中, 2: 高, 3: 紧急
        },
        true,
      );
    }

    // 9. 获取维修记录
    await this.request('GET', '/instruments/repairs', null, true);
  }

  async testNewsAPIs() {
    console.log('\n========== 测试新闻接口 ==========\n');

    // 1. 发布新闻
    const createNewsData = {
      title: `测试新闻_${Date.now()}`,
      content: '这是一条测试新闻内容',
      category: 'ANNOUNCEMENT',
      coverImage: 'https://example.com/image.jpg',
    };

    const createRes = await this.request('POST', '/news', createNewsData, true);

    if (createRes && createRes.status === 201) {
      const newsData = createRes.data.data;
      if (newsData && newsData.id) {
        this.testNewsId = newsData.id;
        console.log(`✓ 发布新闻成功，ID: ${this.testNewsId}`);
      }
    }

    // 2. 获取所有新闻(公开)
    await this.request('GET', '/news', null, false);

    // 3. 搜索新闻
    await this.request('GET', '/news?keyword=测试', null, false);

    // 4. 获取待审核新闻
    await this.request('GET', '/news/pending', null, true);

    // 5. 获取新闻详情
    if (this.testNewsId) {
      await this.request('GET', `/news/${this.testNewsId}`, null, false);
    }

    // 6. 点赞新闻
    if (this.testNewsId) {
      await this.request('POST', `/news/${this.testNewsId}/like`, null, true);
    }

    // 7. 审核新闻(需要管理员权限)
    if (this.testNewsId) {
      await this.request(
        'PATCH',
        `/news/${this.testNewsId}/review`,
        { approved: true },
        true,
      );
    }
  }

  async testNotificationAPIs() {
    console.log('\n========== 测试通知接口 ==========\n');

    // 1. 创建通知(系统内部使用)
    const createNotificationData = {
      userId: this.testUserId || 1,
      type: 'APPOINTMENT_REVIEW',
      title: '测试通知',
      content: '这是一条测试通知',
    };

    const createRes = await this.request(
      'POST',
      '/notifications',
      createNotificationData,
      true,
    );

    if (createRes && createRes.status === 201) {
      const notificationData = createRes.data.data;
      if (notificationData && notificationData.id) {
        this.testNotificationId = notificationData.id;
        console.log(`✓ 创建通知成功，ID: ${this.testNotificationId}`);
      }
    }

    // 2. 获取我的通知
    await this.request('GET', '/notifications', null, true);

    // 3. 获取未读通知
    await this.request('GET', '/notifications?isRead=false', null, true);

    // 4. 获取未读数量
    await this.request('GET', '/notifications/unread-count', null, true);

    // 5. 标记为已读
    if (this.testNotificationId) {
      await this.request(
        'PATCH',
        `/notifications/${this.testNotificationId}/read`,
        null,
        true,
      );
    }

    // 6. 全部标记为已读
    await this.request('PATCH', '/notifications/read-all', null, true);

    // 7. 删除通知
    if (this.testNotificationId) {
      await this.request(
        'DELETE',
        `/notifications/${this.testNotificationId}`,
        null,
        true,
      );
    }
  }

  async testFavoritesAPIs() {
    console.log('\n========== 测试收藏接口 ==========\n');

    if (!this.testLabId) {
      console.log('⚠ 跳过收藏测试:没有可用的实验室ID');
      return;
    }

    // 1. 添加收藏
    await this.request('POST', `/favorites/${this.testLabId}`, null, true);

    // 2. 获取我的收藏
    await this.request('GET', '/favorites', null, true);

    // 3. 检查是否收藏
    await this.request('GET', `/favorites/${this.testLabId}/check`, null, true);

    // 4. 取消收藏
    await this.request('DELETE', `/favorites/${this.testLabId}`, null, true);
  }

  async testEvaluationAPIs() {
    console.log('\n========== 测试评价接口 ==========\n');

    if (!this.testLabId) {
      console.log('⚠ 跳过评价测试:没有可用的实验室ID');
      return;
    }

    // 1. 提交评价
    await this.request(
      'POST',
      '/evaluations',
      {
        labId: this.testLabId,
        overallRating: 5,
        comment: '实验室设施很好',
        environmentRating: 5,
        equipmentRating: 5,
        serviceRating: 4,
      },
      true,
    );

    // 2. 获取实验室评价
    await this.request(
      'GET',
      `/evaluations/lab/${this.testLabId}`,
      null,
      false,
    );

    // 3. 获取评价统计
    await this.request(
      'GET',
      `/evaluations/lab/${this.testLabId}/statistics`,
      null,
      false,
    );
  }

  async runAllTests() {
    console.log('========================================');
    console.log('开始全面测试所有API接口');
    console.log('========================================');

    try {
      await this.testAuthAPIs();
      await this.testUserAPIs();
      await this.testLabAPIs();
      await this.testAppointmentAPIs();
      await this.testInstrumentAPIs();
      await this.testNewsAPIs();
      await this.testNotificationAPIs();
      await this.testFavoritesAPIs();
      await this.testEvaluationAPIs();
    } catch (error) {
      console.error('测试过程中发生错误:', error);
    }

    this.generateReports();
  }

  private generateReports() {
    console.log('\n========================================');
    console.log('生成测试报告');
    console.log('========================================\n');

    const logsDir = path.join(__dirname, 'test-logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // 生成完整日志
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsFile = path.join(logsDir, `api-test-logs-${timestamp}.json`);
    fs.writeFileSync(logsFile, JSON.stringify(this.logs, null, 2));
    console.log(`✓ 完整日志已保存: ${logsFile}`);

    // 生成bug报告
    if (this.bugs.length > 0) {
      const bugsFile = path.join(logsDir, `bugs-${timestamp}.json`);
      fs.writeFileSync(bugsFile, JSON.stringify(this.bugs, null, 2));
      console.log(
        `\x1b[31m✗ 发现 ${this.bugs.length} 个问题，详情: ${bugsFile}\x1b[0m`,
      );

      console.log('\n问题汇总:');
      this.bugs.forEach((bug, index) => {
        console.log(`\n${index + 1}. [${bug.method}] ${bug.url}`);
        console.log(`   错误: ${bug.error}`);
        console.log(`   状态码: ${bug.statusCode || 'N/A'}`);
      });
    } else {
      console.log('\x1b[32m✓ 所有接口测试通过，未发现问题\x1b[0m');
    }

    // 统计信息
    const totalTests = this.logs.length;
    const successTests = this.logs.filter(
      (log) => log.status >= 200 && log.status < 300,
    ).length;
    const failedTests = totalTests - successTests;

    console.log('\n========== 测试统计 ==========');
    console.log(`总测试数: ${totalTests}`);
    console.log(`\x1b[32m成功: ${successTests}\x1b[0m`);
    console.log(`\x1b[31m失败: ${failedTests}\x1b[0m`);
    console.log(`成功率: ${((successTests / totalTests) * 100).toFixed(2)}%`);
  }
}

// 运行测试
const tester = new APITester();
tester.runAllTests().catch(console.error);
