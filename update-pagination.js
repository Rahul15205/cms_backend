const fs = require('fs');

function processFile(filePath) {
  if (!filePath) return;
  filePath = filePath.trim();
  if(!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const singleLineRegex = /return\s*\{\s*total,\s*page:\s*(Math\.floor\([^)]+\)\s*\+\s*1),\s*limit:\s*(take|limit),\s*data(?::\s*([^}]+))?\s*\};/g;
  
  if (singleLineRegex.test(content)) {
    content = content.replace(singleLineRegex, (match, pageExpr, limitVar, dataVar) => {
      const dataArg = dataVar ? dataVar.trim() : 'data';
      return "return paginate(" + dataArg + ", total, " + pageExpr + ", " + limitVar + ");";
    });
    changed = true;
  }

  const multiBlockRegex = /return\s*\{\s*total,\s*page:\s*([^,]+),\s*limit:\s*([^,]+),\s*data(?::\s*([^}]+))?\s*\};?/g;
  
  if (multiBlockRegex.test(content) && !changed) {
    content = content.replace(multiBlockRegex, (match, pageExpr, limitVar, dataVar) => {
        const dataArg = dataVar ? dataVar.trim() : 'data';
        return "return paginate(" + dataArg + ", total, " + pageExpr.trim() + ", " + limitVar.trim() + ");";
    });
    changed = true;
  }

  if (changed) {
    if (!content.includes('import { paginate }')) {
        content = content.replace(/(import.*'@nestjs\/common';)/, "$1\nimport { paginate } from '../common/dto/paginated-response.dto';");
    }
    fs.writeFileSync(filePath, content);
    console.log('Updated:', filePath);
  }
}

const files = require('child_process').execSync('dir /s /b src\\\\*.service.ts').toString().split('\n');
files.forEach(processFile);
console.log('Done');
