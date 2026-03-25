import fs from 'fs';
import path from 'path';

const adminDir = path.join('c:', 'Users', 'LENOVO', 'Desktop', 'church_website', 'frontEnd', 'src', 'pages', 'Jumuiya', 'admin');

fs.readdirSync(adminDir).forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(adminDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        // Fix import paths
        content = content.replace(/\.\.\/\.\.\/context\//g, '../context/');
        content = content.replace(/\.\.\/\.\.\/data\//g, '../data/');

        // Fix implicit any in array functions
        content = content.replace(/\(j\s*=>/g, '(j: any =>');
        content = content.replace(/\(o\s*=>/g, '(o: any =>');
        content = content.replace(/\(img\s*,/g, '(img: any,');
        content = content.replace(/,\s*idx\s*\)/g, ', idx: number)');
        content = content.replace(/\(act\s*=>/g, '(act: any =>');
        content = content.replace(/\(m\s*=>/g, '(m: any =>');

        // Also sometimes it's like (j) =>
        content = content.replace(/\(j\)\s*=>/g, '(j: any) =>');
        content = content.replace(/\(o\)\s*=>/g, '(o: any) =>');
        content = content.replace(/\(img,\s*idx\)/g, '(img: any, idx: number)');

        fs.writeFileSync(filePath, content);
    }
});
console.log('Fixed admin files TS errors');
