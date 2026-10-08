document.addEventListener('DOMContentLoaded', () => {
// Elementos DOM
const passwordInput = document.getElementById('passwordInput');
const lengthSlider = document.getElementById('lengthSlider');
const lengthVal = document.getElementById('lengthVal');
const expirySelect = document.getElementById('expirySelect');
const expiryValDisplay = document.getElementById('expiryValDisplay');
const timerText = document.getElementById('timerText');
const expiryBar = document.getElementById('expiryBar');

const incUppercase = document.getElementById('incUppercase');
const incLowercase = document.getElementById('incLowercase');
const incNumbers = document.getElementById('incNumbers');
const incSymbols = document.getElementById('incSymbols');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');

const circleProgress = document.getElementById('circleProgress');
const percentageVal = document.getElementById('percentageVal');
const strengthText = document.getElementById('strengthText');
const entropyVal = document.getElementById('entropyVal');
const crackTime = document.getElementById('crackTime');

const checkLength = document.getElementById('checkLength');
const checkCases = document.getElementById('checkCases');
const checkNumbers = document.getElementById('checkNumbers');
const checkSymbols = document.getElementById('checkSymbols');
const checkEntropy = document.getElementById('checkEntropy');

// Modais e botões
const openEmailBtn = document.getElementById('openEmailBtn');
const emailModal = document.getElementById('emailModal');
const closeEmailBtn = document.getElementById('closeEmailBtn');
const recipientEmail = document.getElementById('recipientEmail');
const emailPreview = document.getElementById('emailPreview');
const openClientBtn = document.getElementById('openClientBtn');
const simulateSendBtn = document.getElementById('simulateSendBtn');
const shareModes = document.getElementsByName('shareMode');

const openGuideBtn = document.getElementById('openGuideBtn');
const guideModal = document.getElementById('guideModal');
const closeGuideBtn = document.getElementById('closeGuideBtn');

// Variáveis Globais do Timer
let timerInterval = null;
let totalSeconds = 15 * 60;
let remainingSeconds = 15 * 60;

// Caracteres para geração
const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Atualiza Slider e Select
lengthSlider.addEventListener('input', () => {
    lengthVal.textContent = lengthSlider.value;
    analyzePassword();
});

expirySelect.addEventListener('change', () => {
    const mins = parseInt(expirySelect.value);
    expiryValDisplay.textContent = mins === 60 ? '60 minutos (1 hora)' : `${mins} minutos`;
    resetTimer(mins * 60);
});

passwordInput.addEventListener('input', analyzePassword);

generateBtn.addEventListener('click', generatePassword);

function generatePassword() {
    let pool = '';
    if (incUppercase.checked) pool += CHARS.upper;
    if (incLowercase.checked) pool += CHARS.lower;
    if (incNumbers.checked) pool += CHARS.numbers;
    if (incSymbols.checked) pool += CHARS.symbols;

    if (!pool) {
        alert('Selecione ao menos um tipo de caractere!');
        return;
    }

    const length = parseInt(lengthSlider.value);
    let result = '';
    const cryptoObj = window.crypto || window.msCrypto;
    const randomValues = new Uint32Array(length);
    cryptoObj.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        result += pool[randomValues[i] % pool.length];
    }

    passwordInput.value = result;
    analyzePassword();
    resetTimer(parseInt(expirySelect.value) * 60);
}

function analyzePassword() {
    const pwd = passwordInput.value;
    if (!pwd) {
        updateGauge(0, 'Nenhuma', '#f85149');
        entropyVal.textContent = '0';
        crackTime.textContent = '0 segundos';
        updateMetrics(false, false, false, false, false);
        return;
    }

    let poolSize = 0;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSym = /[^A-Za-z0-9]/.test(pwd);

    if (hasUpper) poolSize += 26;
    if (hasLower) poolSize += 26;
    if (hasNum) poolSize += 10;
    if (hasSym) poolSize += 32;

    const entropy = poolSize > 0 ? Math.round(pwd.length * Math.log2(poolSize)) : 0;
    entropyVal.textContent = entropy;

    const hasMinLen = pwd.length >= 12;
    const hasCases = hasUpper && hasLower;
    const isHighEntropy = entropy > 60;

    updateMetrics(hasMinLen, hasCases, hasNum, hasSym, isHighEntropy);

    // Porcentagem calculada até um alvo de 90 bits de entropia
    let scorePct = Math.min(100, Math.round((entropy / 90) * 100));
    let label = 'Muito Fraca';
    let color = '#f85149';

    if (scorePct >= 80) {
        label = 'Muito Forte';
        color = '#2ea043';
    } else if (scorePct >= 60) {
        label = 'Forte';
        color = '#3fb950';
    } else if (scorePct >= 40) {
        label = 'Média';
        color = '#d29922';
    } else if (scorePct >= 20) {
        label = 'Fraca';
        color = '#db6d28';
    }

    updateGauge(scorePct, label, color);
    calculateCrackTime(entropy);
    updateEmailPreview();
}

function updateGauge(pct, label, color) {
    percentageVal.textContent = `${pct}%`;
    strengthText.textContent = label;
    const circumference = 2 * Math.PI * 50; // r=50
    const offset = circumference - (pct / 100) * circumference;
    circleProgress.style.strokeDasharray = circumference;
    circleProgress.style.strokeDashoffset = offset;
    circleProgress.style.stroke = color;
}

function updateMetrics(len, cases, num, sym, ent) {
    checkLength.textContent = len ? '✅' : '❌';
    checkCases.textContent = cases ? '✅' : '❌';
    checkNumbers.textContent = num ? '✅' : '❌';
    checkSymbols.textContent = sym ? '✅' : '❌';
    checkEntropy.textContent = ent ? '✅' : '❌';
}

function calculateCrackTime(entropy) {
    if (entropy === 0) {
        crackTime.textContent = '0 segundos';
        return;
    }

    const combinations = Math.pow(2, entropy);
    const speed = 10e9; // 10 bilhões/segundo
    const seconds = combinations / speed;

    if (seconds < 1) {
        crackTime.textContent = 'Instantâneo';
    } else if (seconds < 60) {
        crackTime.textContent = `${Math.round(seconds)} segundos`;
    } else if (seconds < 3600) {
        crackTime.textContent = `${Math.round(seconds / 60)} minutos`;
    } else if (seconds < 86400) {
        crackTime.textContent = `${Math.round(seconds / 3600)} horas`;
    } else if (seconds < 31536000) {
        crackTime.textContent = `${Math.round(seconds / 86400)} dias`;
    } else if (seconds < 31536000000) {
        crackTime.textContent = `${Math.round(seconds / 31536000)} anos`;
    } else {
        crackTime.textContent = 'Séculos / Milênios';
    }
}

// Timer de Expiração
function resetTimer(seconds) {
    clearInterval(timerInterval);
    totalSeconds = seconds;
    remainingSeconds = seconds;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        remainingSeconds--;
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            remainingSeconds = 0;
            passwordInput.value = '';
            analyzePassword();
            alert('A senha temporária expirou!');
        }
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    timerText.textContent = `${m}:${s}`;

    const pct = (remainingSeconds / totalSeconds) * 100;
    expiryBar.style.width = `${pct}%`;
}

// Copiar Senha
copyBtn.addEventListener('click', () => {
    if (!passwordInput.value) return;
    navigator.clipboard.writeText(passwordInput.value);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '✅ Copiado!';
    setTimeout(() => copyBtn.innerHTML = originalText, 1500);
});

// Modais
openEmailBtn.addEventListener('click', () => {
    emailModal.classList.add('active');
    updateEmailPreview();
});
closeEmailBtn.addEventListener('click', () => emailModal.classList.remove('active'));

openGuideBtn.addEventListener('click', () => guideModal.classList.add('active'));
closeGuideBtn.addEventListener('click', () => guideModal.classList.remove('active'));

shareModes.forEach(radio => radio.addEventListener('change', updateEmailPreview));

function updateEmailPreview() {
    const mode = Array.from(shareModes).find(r => r.checked).value;
    const pwd = passwordInput.value || '[Nenhuma senha gerada]';
    const entropy = entropyVal.textContent;
    const strength = strengthText.textContent;

    let body = `--- CyberGuard Segurança ---\n\n`;
    if (mode === 'full') {
        body += `Sua Senha Temporária: ${pwd}\n`;
        body += `Validade: ${expirySelect.value} minutos\n\n`;
    }
    body += `Relatório de Segurança:\n`;
    body += `- Classificação: ${strength}\n`;
    body += `- Entropia Calculada: ${entropy} bits\n`;
    body += `- Estimativa de Força Bruta: ${crackTime.textContent}\n`;

    emailPreview.textContent = body;
}

openClientBtn.addEventListener('click', () => {
    const email = recipientEmail.value;
    const body = encodeURIComponent(emailPreview.textContent);
    window.location.href = `mailto:${email}?subject=Senha%20Temporaria%20CyberGuard&body=${body}`;
});

simulateSendBtn.addEventListener('click', () => {
    alert('E-mail gerado e enviado com sucesso no ambiente de simulação!');
    emailModal.classList.remove('active');
});

// Inicialização
generatePassword();
