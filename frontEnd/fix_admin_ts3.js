import fs from 'fs';
import path from 'path';

const adminDir = path.join('c:', 'Users', 'LENOVO', 'Desktop', 'church_website', 'frontEnd', 'src', 'pages', 'Jumuiya', 'admin');

fs.readdirSync(adminDir).forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const filePath = path.join(adminDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        content = content.replace(/find\(j:\s*any\)\s*=>/g, 'find((j: any) =>');
        content = content.replace(/map\(j:\s*any\)\s*=>/g, 'map((j: any) =>');

        content = content.replace(/filter\(o:\s*any\)\s*=>/g, 'filter((o: any) =>');
        content = content.replace(/findIndex\(o:\s*any\)\s*=>/g, 'findIndex((o: any) =>');

        content = content.replace(/map\(act:\s*any\)\s*=>/g, 'map((act: any) =>');
        content = content.replace(/map\(m:\s*any\)\s*=>/g, 'map((m: any) =>');
        content = content.replace(/map\(img:\s*any\)/g, 'map((img: any)');

        fs.writeFileSync(filePath, content);
    }
});
console.log('Fixed typescript parentheses errors');
