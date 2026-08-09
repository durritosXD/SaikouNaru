const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const replacements = {
  'bg-\\[#121212\\]': 'bg-theme-card',
  'bg-\\[#1A1A1A\\]': 'bg-theme-surface',
  'border-\\[#262626\\]': 'border-theme-border',
  'border-\\[#404040\\]': 'border-theme-borderLight',
  'hover:bg-\\[#1A1A1A\\]': 'hover:bg-theme-surface',
  'hover:bg-\\[#262626\\]': 'hover:bg-theme-border',
  'hover:border-\\[#404040\\]': 'hover:border-theme-borderLight',
  'text-\\[#FF0033\\]': 'text-theme-primary',
  'bg-\\[#FF0033\\]': 'bg-theme-primary',
};

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkAndReplace(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(key, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          modified = true;
        }
      }
      
      // Special replacements that don't use regex for special chars
      // We want to avoid replacing bg-black/90 with bg-theme-bg/90 if that breaks
      // Actually, bg-black alone is safe
      const bgBlackRegex = /bg-black(?!\/)/g;
      if (bgBlackRegex.test(content)) {
        content = content.replace(bgBlackRegex, 'bg-theme-bg');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walkAndReplace(srcDir);
console.log('Done replacing theme colors.');
