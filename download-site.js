const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 要下载的网站
const baseUrl = 'https://tests-1101.pages.dev';

// 创建目录
const downloadDir = path.join(__dirname, 'downloaded-site');
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
}

// 要下载的文件列表
const filesToDownload = [
    '/',
    '/index.html',
    '/admin.html',
    '/upload.html',
    '/styles.css',
    '/script.js',
    '/saveTest.js',
    '/README.md',
    '/tests/test_list.json',
    // 尝试下载常见的测试文件
    '/tests/test1.json',
    '/tests/test2.json',
];

// 下载文件函数
function downloadFile(url, filepath, callback) {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
        if (response.statusCode === 200) {
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✅ 成功下载: ${url} -> ${filepath}`);
                callback(null);
            });
        } else if (response.statusCode === 301 || response.statusCode === 302) {
            const newUrl = response.headers.location;
            console.log(`🔄 重定向: ${url} -> ${newUrl}`);
            downloadFile(newUrl, filepath, callback);
        } else {
            console.log(`❌ 无法下载: ${url} (状态码: ${response.statusCode})`);
            callback(new Error(`HTTP ${response.statusCode}`));
        }
    }).on('error', (error) => {
        console.log(`❌ 下载失败: ${url}`, error.message);
        callback(error);
    });
}

// 批量下载
let index = 0;
function downloadNext() {
    if (index >= filesToDownload.length) {
        console.log('\n🎉 所有文件下载完成！');
        console.log(`📁 文件保存在: ${downloadDir}`);
        return;
    }
    
    const file = filesToDownload[index];
    const url = baseUrl + file;
    const filepath = path.join(downloadDir, file === '/' ? 'index.html' : file);
    
    downloadFile(url, filepath, (error) => {
        index++;
        setTimeout(downloadNext, 500); // 稍微延迟避免请求过快
    });
}

console.log(`🚀 开始下载网站: ${baseUrl}`);
console.log(`📁 目标目录: ${downloadDir}`);
console.log('='.repeat(60));
downloadNext();
