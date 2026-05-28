// 全局变量
let currentTest = null;
let userAnswers = {};
let markedQuestions = new Set();
let timerInterval = null;
let secondsElapsed = 0;
let isSubmitted = false;
const STORAGE_KEY = 'testSystemData';

// DOM元素
const testSelector = document.getElementById('testSelector');
const loadTestBtn = document.getElementById('loadTestBtn');
const timer = document.getElementById('timer');
const questionTypes = document.getElementById('questionTypes');
const questionGrid = document.getElementById('questionGrid');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const testHeader = document.getElementById('testHeader');
const testTitle = document.getElementById('testTitle');
const questionsContainer = document.getElementById('questionsContainer');

document.addEventListener('DOMContentLoaded', () => {
    // 加载可用的测试
    loadAvailableTests();

    // 事件监听器
    loadTestBtn.addEventListener('click', loadSelectedTest);
    submitBtn.addEventListener('click', submitTest);
    resetBtn.addEventListener('click', resetTest);

    // 尝试加载缓存的答题数据
    loadCachedTestData();
});

// 加载缓存的答题数据
function loadCachedTestData() {
    const cachedData = localStorage.getItem(STORAGE_KEY);
    if (!cachedData) return;

    try {
        const data = JSON.parse(cachedData);
        if (!data.testId || !data.userAnswers || !data.markedQuestions || data.secondsElapsed === undefined) return;

        // 设置缓存数据
        testSelector.value = data.testId;
        userAnswers = data.userAnswers || {};
        markedQuestions = new Set(data.markedQuestions || []);
        secondsElapsed = data.secondsElapsed || 0;
        isSubmitted = data.isSubmitted || false;

        // 如果缓存中有试卷ID，尝试加载试卷
        if (data.testId) {
            loadTestById(data.testId, true);
        }
    } catch (e) {
        console.error('加载缓存数据失败:', e);
        clearCachedData();
    }
}

// 根据ID加载试卷
async function loadTestById(testId, fromCache = false) {
    try {
        resetTestState(fromCache);
        const response = await fetch(`./tests/${testId}.json`);
        if (!response.ok) throw new Error('无法加载测试数据');

        currentTest = await response.json();

        // 更新UI
        updateTestUI();

        // 如果不是从缓存加载，重置计时器
        if (!fromCache) {
            secondsElapsed = 0;
        }

        // 开始计时
        startTimer();

        // 显示恢复提示
        if (fromCache && (Object.keys(userAnswers).length > 0 || markedQuestions.size > 0)) {
            alert('检测到未完成的答题记录，已自动恢复。如需重新开始，请点击"重置缓存"按钮。');
        }
    } catch (error) {
        console.error('加载测试失败:', error);
        loadDemoTest();
    }
}

// 保存答题数据到缓存
function saveTestData() {
    if (!currentTest) return;

    const data = {
        testId: currentTest.id,
        userAnswers: userAnswers,
        markedQuestions: Array.from(markedQuestions),
        secondsElapsed: secondsElapsed,
        isSubmitted: isSubmitted,
        timestamp: new Date().getTime()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 清除缓存数据
function clearCachedData() {
    localStorage.removeItem(STORAGE_KEY);
}

// 加载可用的测试
async function loadAvailableTests() {
    try {
        const response = await fetch('./tests/test_list.json');
        if (!response.ok) throw new Error('无法加载测试列表');

        const tests = await response.json();
        testSelector.innerHTML = '<option value="">-- 请选择试卷 --</option>';
        tests.forEach(test => {
            const option = document.createElement('option');
            option.value = test.id;
            option.textContent = test.name;
            testSelector.appendChild(option);
        });
    } catch (error) {
        console.error('加载测试列表失败:', error);
        const defaultOption = document.createElement('option');
        defaultOption.value = 'demo';
        defaultOption.textContent = '演示试卷';
        testSelector.appendChild(defaultOption);
    }
}

// 加载选定的测试
async function loadSelectedTest() {
    const testId = testSelector.value;
    if (!testId) {
        alert('请选择一份试卷');
        return;
    }

    loadTestById(testId);
}

// 重置测试状态
function resetTestState(fromCache = false) {
    if (!fromCache) {
        userAnswers = {};
        markedQuestions = new Set();
        secondsElapsed = 0;
        isSubmitted = false;
        clearCachedData();
    }

    // 重置UI
    timer.textContent = '00:00:00';
    questionTypes.innerHTML = '';
    questionGrid.innerHTML = '';
    scoreDisplay.textContent = '';
    testTitle.textContent = '';
    questionsContainer.innerHTML = '';
    submitBtn.disabled = false;

    if (!fromCache) {
        testHeader.textContent = '请选择试卷';
    }
}

// 重置缓存状态（保留当前试卷）
function resetTest() {
    if (!currentTest) return;

    if (confirm('确定要重置缓存吗？这将清除所有答题记录和标记，无法恢复！')) {
        userAnswers = {};
        markedQuestions = new Set();
        clearInterval(timerInterval);
        secondsElapsed = 0;
        isSubmitted = false;
        clearCachedData();

        // 重置UI
        timer.textContent = '00:00:00';
        scoreDisplay.textContent = '';
        submitBtn.disabled = false;

        // 重新创建答题卡和问题区域
        createAnswerSheet();
        createQuestionsArea();

        // 重新开始计时
        startTimer();
    }
}

// 更新测试UI
function updateTestUI() {
    // 设置标题
    testHeader.textContent = currentTest.title;
    testTitle.textContent = currentTest.title;

    // 创建答题卡
    createAnswerSheet();

    // 创建问题区域
    createQuestionsArea();

    // 保存数据
    saveTestData();
}

// 创建答题卡
function createAnswerSheet() {
    questionGrid.innerHTML = '';

    currentTest.questions.forEach((question, index) => {
        const questionNumber = index + 1;

        // 添加题型标签（如果这是新题型的第一个问题）
        if (index === 0 || currentTest.questions[index - 1].type !== question.type) {
            const typeLabel = document.createElement('div');
            typeLabel.className = 'question-types';
            typeLabel.textContent = question.type;
            typeLabel.style.width = '100%';
            questionGrid.appendChild(typeLabel);
        }

        // 创建问题方格
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.textContent = questionNumber;
        questionItem.dataset.questionNumber = questionNumber;

        // 恢复已答题状态
        if (isQuestionAnswered(questionNumber)) {
            questionItem.classList.add('answered');
        }

        // 恢复标记状态
        if (markedQuestions.has(questionNumber)) {
            questionItem.classList.add('marked');
        }

        // 点击事件
        questionItem.addEventListener('click', () => {
            scrollToQuestion(questionNumber);
        });

        questionGrid.appendChild(questionItem);
    });
}

// 检查题目是否已作答
function isQuestionAnswered(questionNumber) {
    const answer = userAnswers[questionNumber];
    if (answer === undefined || answer === null) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
}

// 创建问题区域
function createQuestionsArea() {
    questionsContainer.innerHTML = '';

    currentTest.questions.forEach((question, index) => {
        const questionNumber = index + 1;
        const isMultipleChoice = question.type && question.type.includes('多选');

        const questionContainer = document.createElement('div');
        questionContainer.className = 'question-container';
        questionContainer.id = `question-${questionNumber}`;

        // 问题头部
        const questionHeader = document.createElement('div');
        questionHeader.className = 'question-header';

        // 标记按钮
        const flagBtn = document.createElement('button');
        flagBtn.className = 'flag-btn';
        flagBtn.innerHTML = '🔖';
        flagBtn.title = isMultipleChoice ? '标记此题（多选题）' : '标记此题';
        flagBtn.dataset.questionNumber = questionNumber;
        flagBtn.addEventListener('click', toggleQuestionMark);

        // 恢复标记状态
        if (markedQuestions.has(questionNumber)) {
            flagBtn.style.color = 'red';
        }

        // 问题编号
        const questionNumberElement = document.createElement('span');
        questionNumberElement.className = 'question-number';
        questionNumberElement.textContent = `${questionNumber}.`;

        // 问题文本
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.innerHTML = formatQuestionText(question.text);

        questionHeader.appendChild(flagBtn);
        questionHeader.appendChild(questionNumberElement);
        questionHeader.appendChild(questionText);

        // 选项列表
        const optionsList = document.createElement('ul');
        optionsList.className = 'options-list';

        question.options.forEach((option, optionIndex) => {
            const optionItem = document.createElement('li');
            optionItem.className = 'option-item';
            optionItem.dataset.questionNumber = questionNumber;
            optionItem.dataset.optionIndex = optionIndex;
            
            const prefix = isMultipleChoice ? '☐' : '';
            optionItem.innerHTML = `${prefix}${String.fromCharCode(65 + optionIndex)}. ${formatQuestionText(option)}`;

            // 恢复已选答案
            if (isMultipleChoice) {
                const answers = userAnswers[questionNumber];
                if (Array.isArray(answers) && answers.includes(optionIndex)) {
                    optionItem.classList.add('selected');
                    optionItem.innerHTML = `☑${String.fromCharCode(65 + optionIndex)}. ${formatQuestionText(option)}`;
                }
            } else {
                if (userAnswers[questionNumber] === optionIndex) {
                    optionItem.classList.add('selected');
                }
            }

            optionItem.addEventListener('click', () => {
                if (!isSubmitted) {
                    selectAnswer(questionNumber, optionIndex, isMultipleChoice);
                }
            });

            optionsList.appendChild(optionItem);
        });

        // 答案反馈
        const answerFeedback = document.createElement('div');
        answerFeedback.className = 'answer-feedback';
        answerFeedback.id = `feedback-${questionNumber}`;

        questionContainer.appendChild(questionHeader);
        questionContainer.appendChild(optionsList);
        questionContainer.appendChild(answerFeedback);

        questionsContainer.appendChild(questionContainer);
    });

    // 如果已经提交，显示答案
    if (isSubmitted) {
        showAnswersAfterSubmit();
    }
}

// 格式化问题文本（处理代码块）
function formatQuestionText(text) {
    return text.replace(/```python([\s\S]*?)```/g, function (match, code) {
        const formattedCode = code.trim().replace(/\t/g, '    ');
        return '<pre><code class="language-python">' + formattedCode + '</code></pre>';
    });
}

// 滚动到指定问题
function scrollToQuestion(questionNumber) {
    const questionElement = document.getElementById(`question-${questionNumber}`);
    if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 标记/取消标记问题
function toggleQuestionMark(event) {
    const questionNumber = parseInt(event.target.dataset.questionNumber);

    if (markedQuestions.has(questionNumber)) {
        markedQuestions.delete(questionNumber);
        event.target.style.color = '';
    } else {
        markedQuestions.add(questionNumber);
        event.target.style.color = 'red';
    }

    // 更新答题卡上的标记
    updateAnswerSheetItem(questionNumber);

    // 保存数据
    saveTestData();
}

// 选择答案
function selectAnswer(questionNumber, optionIndex, isMultipleChoice = false) {
    if (isMultipleChoice) {
        if (!userAnswers[questionNumber]) {
            userAnswers[questionNumber] = [];
        }
        
        const answers = userAnswers[questionNumber];
        const index = answers.indexOf(optionIndex);
        
        if (index > -1) {
            answers.splice(index, 1);
        } else {
            answers.push(optionIndex);
        }
        
        userAnswers[questionNumber] = answers.sort((a, b) => a - b);
    } else {
        userAnswers[questionNumber] = optionIndex;
    }

    // 更新答题卡
    updateAnswerSheetItem(questionNumber);

    // 更新选项样式
    updateOptionStyles(questionNumber, isMultipleChoice);

    // 保存数据
    saveTestData();
}

// 更新答题卡上的项目
function updateAnswerSheetItem(questionNumber) {
    const item = document.querySelector(`.question-item[data-question-number="${questionNumber}"]`);
    if (!item) return;

    item.className = 'question-item';

    if (isQuestionAnswered(questionNumber)) {
        item.classList.add('answered');
    }

    if (markedQuestions.has(parseInt(questionNumber))) {
        item.classList.add('marked');
    }

    if (isSubmitted) {
        const question = currentTest.questions[questionNumber - 1];
        const userAnswer = userAnswers[questionNumber];
        const correctAnswer = question.correctAnswer;

        if (isAnswerCorrect(userAnswer, correctAnswer)) {
            item.classList.add('correct');
        } else if (userAnswer !== undefined) {
            item.classList.add('incorrect');
        }
    }
}

// 判断答案是否正确
function isAnswerCorrect(userAnswer, correctAnswer) {
    if (Array.isArray(correctAnswer)) {
        if (!Array.isArray(userAnswer)) return false;
        if (userAnswer.length !== correctAnswer.length) return false;
        return userAnswer.every((val, idx) => val === correctAnswer[idx]);
    } else {
        return userAnswer === correctAnswer;
    }
}

// 将答案转换为字母
function answerToLetters(answer, isMultipleChoice) {
    if (isMultipleChoice) {
        if (!Array.isArray(answer) || answer.length === 0) {
            return '未作答';
        }
        return answer.map(i => String.fromCharCode(65 + i)).join('、');
    } else {
        if (answer === undefined || answer === null) {
            return '未作答';
        }
        return String.fromCharCode(65 + answer);
    }
}

// 更新选项样式
function updateOptionStyles(questionNumber, isMultipleChoice = false) {
    const options = document.querySelectorAll(`.option-item[data-question-number="${questionNumber}"]`);
    const userAnswer = userAnswers[questionNumber];

    options.forEach((option, index) => {
        option.classList.remove('selected');
        
        if (isMultipleChoice) {
            if (Array.isArray(userAnswer) && userAnswer.includes(index)) {
                option.classList.add('selected');
                option.innerHTML = `☑${String.fromCharCode(65 + index)}. ${formatQuestionText(currentTest.questions[questionNumber - 1].options[index])}`;
            } else {
                option.innerHTML = `☐${String.fromCharCode(65 + index)}. ${formatQuestionText(currentTest.questions[questionNumber - 1].options[index])}`;
            }
        } else {
            if (index === userAnswer) {
                option.classList.add('selected');
            }
        }
    });
}

// 开始计时
function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
        if (secondsElapsed % 5 === 0) {
            saveTestData();
        }
    }, 1000);
}

// 更新计时器显示
function updateTimerDisplay() {
    const hours = Math.floor(secondsElapsed / 3600);
    const minutes = Math.floor((secondsElapsed % 3600) / 60);
    const seconds = secondsElapsed % 60;

    timer.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 提交测试
async function submitTest() {
    if (!currentTest) return;

    if (confirm('确定要提交试卷吗？提交后将无法修改答案！')) {
        isSubmitted = true;
        clearInterval(timerInterval);
        submitBtn.disabled = true;

        // 计算分数
        let score = 0;
        let totalScore = 0;

        currentTest.questions.forEach((question, index) => {
            const questionNumber = index + 1;
            totalScore += question.score || 0;

            if (isAnswerCorrect(userAnswers[questionNumber], question.correctAnswer)) {
                score += question.score || 0;
            }
        });

        // 显示答案
        showAnswersAfterSubmit();

        // 显示分数
        scoreDisplay.textContent = `得分: ${score}/${totalScore}`;

        // 保存数据
        saveTestData();
        
        alert('试卷提交成功！');
    }
}

// 提交后显示答案
function showAnswersAfterSubmit() {
    currentTest.questions.forEach((question, index) => {
        const questionNumber = index + 1;
        const isMultipleChoice = question.type && question.type.includes('多选');
        const userAnswer = userAnswers[questionNumber];
        const correctAnswer = question.correctAnswer;

        // 显示答案反馈
        const feedback = document.getElementById(`feedback-${questionNumber}`);
        
        const userAnswerLetters = answerToLetters(userAnswer, isMultipleChoice);
        const correctAnswerLetters = answerToLetters(correctAnswer, isMultipleChoice);
        
        if (isAnswerCorrect(userAnswer, correctAnswer)) {
            feedback.textContent = `✓ 回答正确！你的答案：${userAnswerLetters}`;
            feedback.classList.add('correct');
        } else {
            feedback.textContent = `✗ 回答错误！你的答案：${userAnswerLetters}，正确答案：${correctAnswerLetters}`;
            feedback.classList.add('incorrect');
        }
        
        // 显示解析
        if (question.explanation) {
            const explanation = document.createElement('div');
            explanation.className = 'explanation';
            explanation.innerHTML = `<strong>解析：</strong>${question.explanation}`;
            feedback.appendChild(explanation);
        }

        // 更新选项样式以显示正确答案
        const options = document.querySelectorAll(`.option-item[data-question-number="${questionNumber}"]`);
        options.forEach((option, optIndex) => {
            option.classList.remove('correct-answer', 'wrong-answer');

            if (isMultipleChoice) {
                const isUserSelected = Array.isArray(userAnswer) && userAnswer.includes(optIndex);
                const isCorrect = Array.isArray(correctAnswer) && correctAnswer.includes(optIndex);
                
                if (isCorrect) {
                    option.classList.add('correct-answer');
                } else if (isUserSelected) {
                    option.classList.add('wrong-answer');
                }
                
                const optionText = currentTest.questions[questionNumber - 1].options[optIndex];
                if (isCorrect && isUserSelected) {
                    option.innerHTML = `☑${String.fromCharCode(65 + optIndex)}. ${formatQuestionText(optionText)}`;
                } else if (isCorrect) {
                    option.innerHTML = `☑${String.fromCharCode(65 + optIndex)}. ${formatQuestionText(optionText)}`;
                    option.classList.add('correct-answer');
                } else if (isUserSelected) {
                    option.innerHTML = `☑${String.fromCharCode(65 + optIndex)}. ${formatQuestionText(optionText)}`;
                    option.classList.add('wrong-answer');
                } else {
                    option.innerHTML = `☐${String.fromCharCode(65 + optIndex)}. ${formatQuestionText(optionText)}`;
                }
            } else {
                if (optIndex === correctAnswer) {
                    option.classList.add('correct-answer');
                } else if (optIndex === userAnswer) {
                    option.classList.add('wrong-answer');
                }
            }
        });

        // 更新答题卡项目
        updateAnswerSheetItem(questionNumber);
    });
}

function loadDemoTest() {
    resetTestState();
    currentTest = {
        id: 'demo',
        title: '演示试卷（未找到对应试卷文件）',
        questions: [
            {
                type: '单选题',
                text: '这是一个演示问题',
                options: ['选项A', '选项B', '选项C', '选项D'],
                correctAnswer: 0,
                score: 5
            }
        ]
    };
    updateTestUI();
    startTimer();
}
