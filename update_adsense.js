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
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const oldScript1 = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1094606266002530" crossorigin="anonymous"></script>';
            const oldScript2 = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1094606266002530" crossorigin="anonymous"></script>';
            const newScript = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1094606266002530"
     crossorigin="anonymous"></script>`;
     
            // Also handle any other variations like the ones in the previous search
            const regex1 = /<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-1094606266002530" crossorigin="anonymous"><\/script>/g;
            const regex2 = /<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-1094606266002530"\s+crossorigin="anonymous"><\/script>/g;

            if (regex1.test(content) || regex2.test(content)) {
                content = content.replace(regex1, newScript);
                content = content.replace(regex2, newScript);
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

updateAdsense(directoryPath);
