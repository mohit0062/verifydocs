const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname);

function updateAdsense(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('.git') && !fullPath.includes('node_modules')) {
                updateAdsense(fullPath);
            }
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
            // Skip updating update_adsense.js itself
            if (file === 'update_adsense.js') {
                continue;
            }
            let content = fs.readFileSync(fullPath, 'utf8');
            const regex = /<script\s+async\s+src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-1094606266002530"\s+crossorigin="anonymous"\s*>\s*<\/script>/g;
            const newScript = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1094606266002530"
     crossorigin="anonymous"></script>`;

            const originalContent = content;
            content = content.replace(regex, newScript);

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

updateAdsense(directoryPath);
