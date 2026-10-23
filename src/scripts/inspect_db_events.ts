import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

console.log('Events in db.json:');
db.events.forEach((e: any) => {
  console.log(`\nEvent [${e.id}] "${e.title}":`);
  console.log('Keys:', Object.keys(e));
});
