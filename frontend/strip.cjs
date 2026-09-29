const fs = require('fs');
const path = require('path');
const dir = 'c:/Projects/ProjectManagement/ProjectMonitoringSyatem/frontend/src/pages';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.jsx')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    // Remove import AppLayout
    content = content.replace(/import\s+AppLayout\s+from\s+['"].*AppLayout['"];?\r?\n?/g, '');
    // Replace <AppLayout> with <React.Fragment>
    content = content.replace(/<AppLayout>/g, '<>');
    content = content.replace(/<\/AppLayout>/g, '</>');
    fs.writeFileSync(fullPath, content, 'utf8');
  }
});
console.log('Done replacing AppLayout in pages');
