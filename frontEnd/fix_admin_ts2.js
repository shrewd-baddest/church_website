import fs from 'fs';
import path from 'path';

const adminDir = path.join('c:', 'Users', 'LENOVO', 'Desktop', 'church_website', 'frontEnd', 'src', 'pages', 'Jumuiya', 'admin');

fs.readdirSync(adminDir).forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const filePath = path.join(adminDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        content = content.replace(/\(j:\s*any\s*=>/g, '(j: any) =>');
        content = content.replace(/\(o:\s*any\s*=>/g, '(o: any) =>');
        content = content.replace(/\(act:\s*any\s*=>/g, '(act: any) =>');
        content = content.replace(/\(m:\s*any\s*=>/g, '(m: any) =>');
        content = content.replace(/\(category:\s*any\s*=>/g, '(category: any) =>');

        fs.writeFileSync(filePath, content);
    }
});
console.log('Fixed syntax errors');
