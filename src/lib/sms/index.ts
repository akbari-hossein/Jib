export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

export class MockSmsProvider implements SmsProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    if (process.env.NODE_ENV === "development") {
      console.info(`[jib:sms] OTP for ${phone.slice(0, 6)}…: ${code}`);
    }
  }
}

export function getSmsProvider(): SmsProvider {
  return new MockSmsProvider();
}
