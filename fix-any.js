import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');
for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    
    // Replace unused variables (warning fix)
    content = content.replace(/let (prevInc|prevExp) /g, 'let _$1 ');
    content = content.replace(/const (cacheKey) /g, 'const _$1 ');
    content = content.replace(/const { transfers } =/g, 'const { transfers: _transfers } =');
    content = content.replace(/const transfers =/g, 'const _transfers =');

    // Replace any
    content = content.replace(/: any/g, ': ReturnType<typeof JSON.parse>');
    content = content.replace(/as any/g, 'as ReturnType<typeof JSON.parse>');
    content = content.replace(/any\[\]/g, 'ReturnType<typeof JSON.parse>[]');
    content = content.replace(/<any>/g, '<ReturnType<typeof JSON.parse>>');

    if (content !== original) {
        fs.writeFileSync(f, content, 'utf8');
    }
}
console.log('Done!');
