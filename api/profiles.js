import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    try {
        const dataDir = path.join(process.cwd(), 'data', 'profiles');
        const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));

        const profiles = files.map((file) => {
            const fullPath = path.join(dataDir, file);
            const raw = fs.readFileSync(fullPath, 'utf8');
            const json = JSON.parse(raw);
            const id = path.basename(file, '.json');
            return {
                id,
                name: json.name || id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            };
        });

        res
            .status(200)
            .json({ profiles: profiles.sort((a, b) => a.id.localeCompare(b.id)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load profiles' });
    }
}

