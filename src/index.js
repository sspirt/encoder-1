const btnOpen = document.getElementById("btnOpen");
const fileInput = document.getElementById("fileInput");
const originalText = document.getElementById("originalText");
const btnSave = document.getElementById("btnSave");
const resultText = document.getElementById("resultText");
const selectEncoder = document.getElementById("selectEncoder");
const btnEncrypt = document.getElementById("btnEncrypt");
const keyInput = document.getElementById("keyInput");
const btnDecrypt = document.getElementById("btnDecrypt");

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

btnOpen.addEventListener("click", function() {
    fileInput.click();
})

fileInput.addEventListener("change", function() {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        originalText.value = e.target.result;
    }
    reader.readAsText(file, "UTF-8");
    fileInput.value = "";
})

btnSave.addEventListener("click", function() {
    const text = resultText.value;
    if (!text.trim()) {
        showToast("Нет данных для сохранения");
        return;
    }
    const blob = new Blob([text], { type: "text/plain;charset=UTF-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "result.txt";
    a.click();
    URL.revokeObjectURL(a.href);
})

btnEncrypt.addEventListener("click", function() {
    if (!originalText.value.trim()) {
        showToast("Введите исходный текст");
        return;
    }
    if (!keyInput.value.trim()) {
        showToast("Введите ключевое слово");
        return;
    }
    if (selectEncoder.value === "columnar") {
        const result = encryptColumnar(originalText.value, keyInput.value);
        if (!result) {
            showToast("Текст не содержит букв английского алфавита");
            return;
        }
        resultText.value = result;
    }
    if (selectEncoder.value === "vigenere") {
        const result = encryptVigenere(originalText.value, keyInput.value);
        if (!result) {
            showToast("Текст не содержит букв русского алфавита");
            return;
        }
        resultText.value = result;
    }
})

function getColumnarReadingOrder(key) {
    const filtered = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (filtered.length === 0) return null;
    const pairs = filtered.split('').map((ch, i) => ({ ch, i }));
    const sorted = [...pairs].sort((a, b) =>
        a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : a.i - b.i
    );
    return {
        readingOrder: sorted.map(p => p.i),
        numColumns: filtered.length,
    }
}

function encryptColumnar(text, key) {
    const plain = text.replace(/[^A-Za-z]/g, '')
    if (plain.length === 0) return '';
    const result = getColumnarReadingOrder(key);
    if (!result) return '';
    const { readingOrder, numColumns } = result;
    const numRows = Math.ceil(plain.length / numColumns);
    const table = [];
    for (let r = 0; r < numRows; r++) {
        const row = [];
        for (let c = 0; c < numColumns; c++) {
            const index = r * numColumns + c;
            row.push(index < plain.length ? plain[index] : '');
        }
        table.push(row);
    }
    let cipher = '';
    for (const c of readingOrder) {
        for (let r = 0; r < numRows; r++) {
            if (table[r][c] !== '') cipher += table[r][c];
        }
    }
    return cipher;
}

const RU_ALPHABET = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"
const RU_SIZE = RU_ALPHABET.length;

function ruIndex(ch) {
    return RU_ALPHABET.indexOf(ch.toUpperCase());
}

function progressiveKeyIndex(filtered, i) {
    const keyPos = i % filtered.length;
    const round = Math.floor(i / filtered.length);
    return (ruIndex(filtered[keyPos]) + round) % RU_SIZE;
}

function encryptVigenere(text, key) {
    const filtered = key.toUpperCase().replace(/[^А-ЯЁ]/g, '')
    if (filtered.length === 0) return '';
    let cipher = '';
    let keyPos = 0;
    for (let i = 0; i < text.length; i++) {
        if (/[А-ЯЁа-яё]/.test(text[i])) {
            const isUpper = text[i] === text[i].toUpperCase();
            const plainIndex = ruIndex(text[i]);
            const keyIndex = progressiveKeyIndex(filtered, keyPos);
            let encryptedChar = RU_ALPHABET[(plainIndex + keyIndex) % RU_SIZE];
            if (!isUpper) encryptedChar = encryptedChar.toLowerCase();
            cipher += encryptedChar;
            keyPos++;
        }
        else {
            cipher += text[i];
        }
    }
    return cipher;
}

btnDecrypt.addEventListener("click", function() {
    if (!originalText.value.trim()) {
        showToast("Введите исходный текст");
        return;
    }
    if (!keyInput.value.trim()) {
        showToast("Введите ключевое слово");
        return;
    }
    if (selectEncoder.value === "columnar") {
        const result = decryptColumnar(originalText.value, keyInput.value);
        if (!result) {
            showToast("Текст не содержит букв английского алфавита");
            return;
        }
        resultText.value = result
    }
    if (selectEncoder.value === "vigenere") {
        const result = decryptVigenere(originalText.value, keyInput.value);
        if (!result) {
            showToast("Текст не содержит букв русского алфавита");
            return;
        }
        resultText.value = result;
    }
})

function decryptColumnar(text, key) {
    const cipher = text.replace(/[^A-Za-z]/g, '')
    if (cipher.length === 0) return '';
    const result = getColumnarReadingOrder(key);
    if (!result) return '';
    const { readingOrder, numColumns } = result;
    const numRows = Math.ceil(cipher.length / numColumns);
    const remainder = cipher.length % numColumns;
    const columnHeights = Array.from({ length: numColumns }, (_, c) =>
        (remainder === 0 || c < remainder) ? numRows : numRows - 1
    );
    const table = Array.from({ length: numRows }, () =>
        new Array(numColumns).fill('')
    );
    let index = 0;
    for (const c of readingOrder) {
        for (let r = 0; r < columnHeights[c]; r++) {
            table[r][c] = cipher[index++];
        }
    }
    let plain = '';
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numColumns; c++) {
            if (table[r][c] !== '') plain += table[r][c];
        }
    }
    return plain;
}

function decryptVigenere(text, key) {
    const filtered = key.toUpperCase().replace(/[^А-ЯЁ]/g, '');
    if (filtered.length === 0) return '';
    let plain = '';
    let keyPos = 0;
    for (let i = 0; i < text.length; i++) {
        if (/[А-ЯЁа-яё]/.test(text[i])) {
            const isUpper = text[i] === text[i].toUpperCase();
            const cipherIndex = ruIndex(text[i]);
            const keyIndex = progressiveKeyIndex(filtered, keyPos);
            let decryptedChar = RU_ALPHABET[(cipherIndex - keyIndex + RU_SIZE) % RU_SIZE];
            if (!isUpper) decryptedChar = decryptedChar.toLowerCase();
            plain += decryptedChar;
            keyPos++;
        }
        else {
            plain += text[i];
        }
    }
    return plain;
}
