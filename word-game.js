const ANSWER_LENGTH = 5;
const ROUNDS = 6;
const boxes = document.querySelectorAll(".box");
const loadingDiv = document.createElement("div");
loadingDiv.classList.add("info-bar");
loadingDiv.textContent = "Loading...";
document.body.appendChild(loadingDiv);

// the state for the app
let currentRow = 0;
let currentGuess = "";
let done = false;
let isLoading = true;
let word, wordParts;

// Attach event listeners immediately
boxes.forEach((box, index) => {
  box.addEventListener("input", function(e) {
    if (done || isLoading) {
      e.preventDefault();
      return;
    }
    
    const letter = e.target.value.toUpperCase();
    if (letter.length > 0 && !isLetter(letter)) {
      e.target.value = "";
      return;
    }
    
    e.target.value = letter;
    
    // Move to next box if a letter was entered
    if (letter.length === 1 && index % ANSWER_LENGTH < ANSWER_LENGTH - 1) {
      boxes[index + 1].focus();
    }
  });

  box.addEventListener("keydown", function(e) {
    if (done) {
      e.preventDefault();
      return;
    }

    const currentIndex = Array.from(boxes).indexOf(e.target);
    const currentRowStart = Math.floor(currentIndex / ANSWER_LENGTH) * ANSWER_LENGTH;
    const currentRowEnd = currentRowStart + ANSWER_LENGTH - 1;

    if (e.key === "Enter") {
      if (currentIndex === currentRowEnd && e.target.value !== "") {
        const word = Array.from(boxes)
          .slice(currentRowStart, currentRowEnd + 1)
          .map(input => input.value)
          .join("");
        currentGuess = word;
        commit();
      }
    } else if (e.key === "Backspace") {
      if (e.target.value === "") {
        e.preventDefault();
        if (currentIndex > currentRowStart) {
          boxes[currentIndex - 1].focus();
          boxes[currentIndex - 1].value = "";
        }
      }
    } else if (e.key === "ArrowLeft" && currentIndex > currentRowStart) {
      e.preventDefault();
      boxes[currentIndex - 1].focus();
    } else if (e.key === "ArrowRight" && currentIndex < currentRowEnd) {
      e.preventDefault();
      boxes[currentIndex + 1].focus();
    }
  });
});

async function init() {
  // clear all boxes
  boxes.forEach(box => {
    box.value = "";
  });

  boxes[0].focus();

  try {
    const res = await fetch("https://words.dev-apis.com/word-of-the-day");
    if (!res.ok) {
      throw new Error(`Failed to fetch word: ${res.status}`);
    }
    const { word: wordRes } = await res.json();
    word = wordRes.toUpperCase();
    wordParts = word.split("");
  } catch (error) {
    console.error("Error fetching word:", error);
    alert("Failed to load word. Please refresh the page.");
    return;
  } finally {
    isLoading = false;
    setLoading(isLoading);
  }
}

function addLetter(letter) {
  if (currentGuess.length < ANSWER_LENGTH) {
    currentGuess += letter;
  } else {
    currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
  }

  boxes[currentRow * ANSWER_LENGTH + currentGuess.length - 1].value = letter;
}

async function commit() {
  if (currentGuess.length !== ANSWER_LENGTH) {
    return;
  }

  isLoading = true;
  setLoading(isLoading);
  
  try {
    const res = await fetch("https://words.dev-apis.com/validate-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: currentGuess }),
    });
    if (!res.ok) {
      throw new Error(`Validation failed: ${res.status}`);
    }
    const { validWord } = await res.json();
    isLoading = false;
    setLoading(isLoading);

    if (!validWord) {
      markInvalidWord();
      return;
    }

    const guessParts = currentGuess.split("");
    const map = makeMap(wordParts);
    let allRight = true;

    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        boxes[currentRow * ANSWER_LENGTH + i].classList.add("correct");
        map[guessParts[i]]--;
      }
    }

    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
      } else if (map[guessParts[i]] && map[guessParts[i]] > 0) {
        allRight = false;
        boxes[currentRow * ANSWER_LENGTH + i].classList.add("close");
        map[guessParts[i]]--;
      } else {
        allRight = false;
        boxes[currentRow * ANSWER_LENGTH + i].classList.add("wrong");
      }
    }

    currentRow++;
    currentGuess = "";
    
    if (!allRight && currentRow < ROUNDS) {
      boxes[currentRow * ANSWER_LENGTH].focus();
    }
    
    if (allRight) {
      alert("you win");
      done = true;
      boxes.forEach(box => box.disabled = true);
    } else if (currentRow === ROUNDS) {
      alert(`you lose, the word was ${word}`);
      done = true;
      boxes.forEach(box => box.disabled = true);
    } else {
      // Focus on first box of next row
      boxes[currentRow * ANSWER_LENGTH].focus();
    }
  } catch (error) {
    console.error("Error validating word:", error);
    isLoading = false;
    setLoading(isLoading);
    markInvalidWord();
  }
}

function backspace() {
  currentGuess = currentGuess.substring(0, currentGuess.length - 1);
  boxes[currentRow * ANSWER_LENGTH + currentGuess.length].value = "";
}

function markInvalidWord() {
  for (let i = 0; i < ANSWER_LENGTH; i++) {
    const box = boxes[currentRow * ANSWER_LENGTH + i];
    box.classList.remove("invalid");

    setTimeout(
      () => box.classList.add("invalid"),
      10
    );
  }
}

function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

function setLoading(isLoading) {
  loadingDiv.classList.toggle("hidden", !isLoading);
}

function makeMap(array) {
  const obj = {};
  for (let i = 0; i < array.length; i++) {
    if (obj[array[i]]) {
      obj[array[i]]++;
    } else {
      obj[array[i]] = 1;
    }
  }
  return obj;
}

init();