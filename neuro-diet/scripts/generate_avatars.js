const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(__dirname, '../assets/avatars');

if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR, { recursive: true });
}

console.log('Downloading 25 placeholder avatars...');

for (let i = 1; i <= 25; i++) {
  const filePath = path.join(DIR, `avatar_${i}.png`);
  // Using DiceBear to generate cute avatars
  const url = `https://api.dicebear.com/7.x/notionists/png?seed=Neuro${i}&size=256&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`;
  
  https.get(url, (res) => {
    const fileStream = fs.createWriteStream(filePath);
    res.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Saved avatar_${i}.png`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading avatar_${i}.png:`, err.message);
  });
}
