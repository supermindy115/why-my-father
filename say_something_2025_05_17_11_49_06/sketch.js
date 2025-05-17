let bubbles = [];
let health = 10; // 血量初始值
let purification = 0; // 淨化值初始值
const maxHealth = 10; // 最大血量
const maxPurification = 10; // 最大淨化值
let gameOver = false;
let gameWon = false; // 遊戲成功標誌
let recognition; // 語音辨識實例

// 正面與負面文字
const positiveSentences = [
  "我會找到屬於自己的路",
  "我並不孤單",
  "我不需要完美",
  "慢慢來也沒關係"
];

const negativeSentences = [
  "我是不是又搞砸了",
  "是不是選錯路就回不去",
  "她們都比我好"
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  generateBubble(); // 開始生成泡泡

  // 初始化語音辨識
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.continuous = true; // 持續監聽
    recognition.interimResults = false; // 僅返回最終結果

    recognition.onstart = () => {
      console.log('語音辨識已啟動');
    };

    recognition.onresult = (event) => {
      const transcript = cleanText(event.results[event.resultIndex][0].transcript).toLowerCase();
      console.log('偵測到語音（格式化後）:', transcript);

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubbleText = cleanText(bubbles[i].text).toLowerCase();

        // 檢查是否匹配（80% 相似度）
        if (isSimilar(transcript, bubbleText, 0.8)) {
          if (bubbles[i].positive) {
            purification = min(purification + 1, maxPurification); // 增加淨化值
            if (purification >= maxPurification) {
              gameWon = true; // 遊戲成功
            }
          } else {
            health = max(health - 1, 0); // 減少血量
            console.log("扣血成功，當前血量：", health);
          }
          bubbles[i].disappearing = true; // 標記泡泡消失
          break;
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('語音辨識錯誤:', event.error);
    };

    recognition.onend = () => {
      console.log('語音辨識已停止，正在重新啟動...');
      recognition.start(); // 自動重啟語音辨識
    };

    recognition.start(); // 啟動語音辨識
  } else {
    console.error('此瀏覽器不支援 Web Speech API');
  }
}

function draw() {
  if (!gameOver && !gameWon) {
    background(30);
    drawHealthBar(); // 繪製血條
    drawPurificationBar(); // 繪製淨化值條
    updateBubbles(); // 更新泡泡
    checkGameOver(); // 檢查遊戲是否結束
  } else if (gameWon) {
    showGameWonScreen(); // 顯示成功畫面
  } else {
    showGameOverScreen(); // 顯示失敗畫面
  }
}

// 生成泡泡
function generateBubble() {
  const positive = random([true, false]); // 隨機正面或負面文字
  const text = positive
    ? random(positiveSentences)
    : random(negativeSentences);

  const bubble = {
    x: random(50, width - 50),
    y: random(50, height - 50),
    text: text,
    positive: positive,
    width: 200, // 初始寬度
    height: 100, // 初始高度
    maxWidth: 250,
    growRate: 0.1,
    alpha: 255, // 透明度
    scale: 1, // 縮放比例
    disappearing: false, // 是否正在消失
  };
  adjustBubbleSize(bubble);
  adjustBubblePosition(bubble);
  bubbles.push(bubble);
  setTimeout(generateBubble, 2000); // 每2秒生成一個泡泡
}

// 調整泡泡大小
function adjustBubbleSize(bubble) {
  textSize(14);
  let words = bubble.text.split(' ');
  let line = '';
  let lineHeight = 18; // 每行文字高度
  let lines = []; // 存儲分行後的文字
  let maxWidth = bubble.maxWidth;

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let testWidth = textWidth(testLine);
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line); // 最後一行文字

  bubble.height = lines.length * lineHeight + 20; // 調整高度
  bubble.width = maxWidth;
  bubble.lines = lines; // 存儲分行文字
}

// 調整泡泡位置
function adjustBubblePosition(bubble) {
  bubble.x = constrain(bubble.x, bubble.width / 2, width - bubble.width / 2);
  bubble.y = constrain(bubble.y, bubble.height / 2, height - bubble.height / 2);
}

// 更新並繪製泡泡
function updateBubbles() {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];

    if (bubble.disappearing) {
      bubble.alpha -= 15; // 漸變透明
      bubble.scale -= 0.05; // 漸變縮小
      if (bubble.alpha <= 0 || bubble.scale <= 0) {
        bubbles.splice(i, 1); // 移除泡泡
        continue;
      }
    }

    // 繪製泡泡
    push();
    translate(bubble.x, bubble.y);
    scale(bubble.scale);
    fill(255, 255, 255, bubble.alpha);
    strokeWeight(2);
    stroke(bubble.positive ? 'green' : 'red');
    rect(-bubble.width / 2, -bubble.height / 2, bubble.width, bubble.height, 20);

    // 繪製文字
    fill(30, bubble.alpha);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    let offsetY = -bubble.height / 2 + (bubble.height - bubble.lines.length * 18) / 2 + 9;
    for (let line of bubble.lines) {
      text(line, 0, offsetY);
      offsetY += 18;
    }
    pop();
  }
}

// 繪製血條
function drawHealthBar() {
  noStroke();
  fill(255, 0, 0); // 紅色血條
  const healthWidth = (health / maxHealth) * width; // 動態計算血條寬度
  rect(0, 0, healthWidth, 20); // 繪製血條
  fill(255); // 白色文字
  textSize(14);
  textAlign(LEFT, CENTER);
  text(`血量: ${health}`, 10, 10); // 顯示血量數值
}

// 繪製淨化值條
function drawPurificationBar() {
  noStroke();
  fill(0, 255, 0); // 綠色淨化值條
  const purificationWidth = (purification / maxPurification) * width; // 動態計算進度條寬度
  rect(0, 25, purificationWidth, 20); // 繪製淨化值條
  fill(255); // 白色文字
  textSize(14);
  textAlign(LEFT, CENTER);
  text(`淨化值: ${purification}`, 10, 35); // 顯示淨化值數字
}

// 檢查遊戲是否結束
function checkGameOver() {
  if (health <= 0) {
    gameOver = true;
  }
}

// 顯示遊戲結束畫面
function showGameOverScreen() {
  background(0);
  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("Game Over", width / 2, height / 2);
}

// 顯示遊戲成功畫面
function showGameWonScreen() {
  background(0);
  fill(0, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("You Won!", width / 2, height / 2);
}

// 清理文字（移除標點符號）
function cleanText(text) {
  return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
}

// 判斷兩段文字相似度是否達到指定比例
function isSimilar(text1, text2, threshold) {
  const length1 = text1.length;
  const length2 = text2.length;
  const maxLength = max(length1, length2);

  let matches = 0;
  for (let i = 0; i < min(length1, length2); i++) {
    if (text1[i] === text2[i]) {
      matches++;
    }
  }

  return matches / maxLength >= threshold;
}