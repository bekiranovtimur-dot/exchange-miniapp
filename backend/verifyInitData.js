// backend/verifyInitData.js
import crypto from 'crypto';

export function checkTelegramAuth(initData, botToken) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const arr = [];
  for (const [k, v] of Array.from(urlParams.entries()).sort()) {
    arr.push(`${k}=${v}`);
  }

  // 👇 важно: именно '\n', а не перенос строки!
  const data = arr.join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calc = crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('hex');

  return (
    hash &&
    crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))
  );
}