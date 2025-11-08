import axios from 'axios';

const baseURL = 'http://localhost:3000';

async function testAuth() {
  console.log('=== 测试认证和用户信息传递 ===\n');

  // 1. 注册
  const timestamp = Date.now();
  const registerData = {
    username: `testuser${timestamp}`.substring(0, 20),
    password: 'Password123',
    confirmPassword: 'Password123',
    email: `test${timestamp}@example.com`,
    phone: '13800138000',
    role: 'STUDENT',
  };

  console.log('1. 注册用户...');
  const registerRes = await axios.post(
    `${baseURL}/auth/register`,
    registerData,
  );
  console.log('注册结果:', JSON.stringify(registerRes.data, null, 2));

  // 2. 登录
  console.log('\n2. 登录...');
  const loginRes = await axios.post(`${baseURL}/auth/login`, {
    username: registerData.username,
    password: registerData.password,
  });

  const token = loginRes.data.data.token || loginRes.data.data.access_token;
  console.log('登录成功，Token:', token);

  // 3. 解码token查看payload
  const tokenParts = token.split('.');
  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  console.log('\nJWT Payload:', JSON.stringify(payload, null, 2));

  // 4. 测试获取用户信息
  console.log('\n3. 获取用户信息...');
  const profileRes = await axios.get(`${baseURL}/user/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log('用户信息:', JSON.stringify(profileRes.data, null, 2));

  // 5. 测试创建新闻(需要userId)
  console.log('\n4. 测试创建新闻...');
  try {
    const newsRes = await axios.post(
      `${baseURL}/news`,
      {
        title: '测试新闻',
        content: '测试内容',
        category: 'ANNOUNCEMENT',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log('新闻创建成功:', JSON.stringify(newsRes.data, null, 2));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('新闻创建失败:', error.response?.data);
    }
  }
}

testAuth().catch(console.error);
