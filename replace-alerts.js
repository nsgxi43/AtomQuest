const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(dashboard)/admin/page.tsx',
  'src/app/(dashboard)/employee/page.tsx',
  'src/app/(dashboard)/manager/approve/[id]/page.tsx',
  'src/app/(dashboard)/shared-goals/page.tsx',
  'src/app/(dashboard)/manager/checkin/page.tsx',
  'src/app/(dashboard)/employee/track/page.tsx',
  'src/app/(dashboard)/employee/goals/new/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('import toast from "react-hot-toast"')) {
    content = content.replace('"use client";', '"use client";\nimport toast from "react-hot-toast";');
  }

  // Replace error/failure alerts with toast.error
  content = content.replace(/alert\((.*error.*|.*Failed.*|.*cannot.*|.*must.*|.*Please.*|.*An error.*)\)/gi, 'toast.error($1)');
  // Replace success alerts with toast.success
  content = content.replace(/alert\((.*successfully.*|.*All updates saved.*|.*Goal sheet unlocked.*|.*Goal sheet returned.*)\)/gi, 'toast.success($1)');
  
  // Any leftover alerts to toast.error just in case
  content = content.replace(/alert\(/g, 'toast.error(');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', file);
});
