import bcrypt from 'bcryptjs';
import { createInterface } from 'readline';
import fs from 'fs';
import path from 'path';

const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question('Enter admin password: ', async (password) => {
  rl.close();
  const hash = await bcrypt.hash(password.trim(), 12);
  console.log('\nAdd this to .env.local:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    if (content.includes('ADMIN_PASSWORD_HASH=')) {
      content = content.replace(/ADMIN_PASSWORD_HASH=.*/, `ADMIN_PASSWORD_HASH=${hash}`);
    } else {
      content += `\nADMIN_PASSWORD_HASH=${hash}`;
    }
    fs.writeFileSync(envPath, content);
    console.log('✓ .env.local updated automatically');
  }
});
