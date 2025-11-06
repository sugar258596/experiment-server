import { Injectable } from '@nestjs/common';
// 使用这个库生成验证码
import * as svgCaptcha from 'svg-captcha';

export interface CaptchaResult {
  svg: string;
  text: string;
}

@Injectable()
export class CaptchaService {
  generateCaptcha(): CaptchaResult {
    const captcha = svgCaptcha.create({
      // 验证码长度
      size: 4,
      // 干扰线条的数量
      noise: 2,
      // 颜色
      color: true,
      background: '#fff',
      // 字体大小
      fontSize: 60,
      // 验证码图形大小
      width: 120,
      height: 40,
    });

    return {
      svg: captcha.data,
      text: captcha.text.toLowerCase(),
    };
  }

  verifyCaptcha(userInput: string, sessionCaptcha: string): boolean {
    if (!userInput || !sessionCaptcha) {
      return false;
    }
    return userInput.toLowerCase() === sessionCaptcha.toLowerCase();
  }
}
