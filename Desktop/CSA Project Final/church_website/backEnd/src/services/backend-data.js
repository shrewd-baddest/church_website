import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');

export class BackendDataService {
    static init() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }

    static load(filename, defaults) {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8').trim();
                // Guard: never return empty string or truly empty file as data
                if (!content || content === '[]' || content === '{}') {
                    console.warn(`[BackendData] ${filename} is empty – using defaults.`);
                    return defaults;
                }
                const parsed = JSON.parse(content);
                // If parsed result is an empty array but defaults have content, prefer defaults
                if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaults) && defaults.length > 0) {
                    return defaults;
                }
                return parsed;
            } catch (e) {
                console.error(`[BackendData] Error loading ${filename}:`, e.message);
                return defaults;
            }
        }
        // File doesn't exist yet – save defaults only if defaults have actual content
        if ((Array.isArray(defaults) && defaults.length > 0) || (!Array.isArray(defaults) && defaults && Object.keys(defaults).length > 0)) {
            this.save(filename, defaults);
        }
        return defaults;
    }

    static save(filename, data) {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const filePath = path.join(DATA_DIR, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
}
