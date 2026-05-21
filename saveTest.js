const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const app = express();

const upload = multer({ dest: 'uploads/' });
const testsDir = path.join(__dirname, 'tests');
const testsJsonPath = path.join(testsDir, 'tests.json');
const answerRecordsPath = path.join(__dirname, 'answer_records.json');

// 确保tests目录存在
if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir);
}

// 确保tests.json文件存在
if (!fs.existsSync(testsJsonPath)) {
    fs.writeFileSync(testsJsonPath, '[]');
}

// 确保答题记录文件存在
if (!fs.existsSync(answerRecordsPath)) {
    fs.writeFileSync(answerRecordsPath, '[]');
}

// 提供静态文件服务，允许局域网访问
app.use(express.static(__dirname));

// 提供 index.html 作为默认页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 获取所有答题记录
app.get('/getAnswerRecords', (req, res) => {
    try {
        const records = JSON.parse(fs.readFileSync(answerRecordsPath, 'utf8'));
        res.json(records);
    } catch (error) {
        console.error('Error:', error);
        res.json([]);
    }
});

// 保存答题记录
app.post('/saveAnswerRecord', express.json(), (req, res) => {
    try {
        const record = req.body;
        
        // 读取现有的答题记录
        let records = [];
        try {
            records = JSON.parse(fs.readFileSync(answerRecordsPath, 'utf8'));
        } catch (e) {
            records = [];
        }
        
        // 添加新记录
        records.push(record);
        
        // 保存到文件
        fs.writeFileSync(answerRecordsPath, JSON.stringify(records, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: error.message });
    }
});

// 删除答题记录
app.post('/deleteAnswerRecords', express.json(), (req, res) => {
    try {
        const { recordIds } = req.body;
        
        // 读取现有的答题记录
        let records = JSON.parse(fs.readFileSync(answerRecordsPath, 'utf8'));
        
        // 过滤掉要删除的记录
        records = records.filter((record, index) => !recordIds.includes(index));
        
        // 保存到文件
        fs.writeFileSync(answerRecordsPath, JSON.stringify(records, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: error.message });
    }
});

app.post('/saveTest', upload.single('file'), (req, res) => {
    try {
        const { id, name, description } = req.body;
        const file = req.file;
        
        // 读取现有的tests.json
        const testsData = JSON.parse(fs.readFileSync(testsJsonPath, 'utf8'));
        
        // 检查ID是否已存在
        if (testsData.some(test => test.id === id)) {
            return res.json({ success: false, message: '试卷ID已存在' });
        }
        
        // 移动上传的文件到tests目录
        const newFilePath = path.join(testsDir, `${id}.json`);
        fs.renameSync(file.path, newFilePath);
        
        // 更新tests.json
        testsData.push({ id, name, description });
        fs.writeFileSync(testsJsonPath, JSON.stringify(testsData, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: error.message });
    }
});

const PORT = 3000;
// 监听所有网络接口，允许局域网访问
app.listen(PORT, '0.0.0.0', () => {
    console.log(`答题系统已启动！`);
    console.log(`本机访问: http://localhost:${PORT}`);
    console.log(`局域网访问: http://你的IP地址:${PORT}`);
});
