const answerLegnth = 5;
const rounds = 6;

const wordapi = await fetch("https://words.dev-apis.com/word-of-the-day");
const word = word.toUpperCase();


// checks if a character is a letter
function isLetter(char) {
  return char.length === 1 && char.match(/[a-z]/i);
}

// only allows letters to be typed into the box
document
  .querySelectorAll(".box")
  .forEach(box => {
    box.addEventListener("keydown", function (event) {
      // uses the isLetter function from above
      if (!isLetter(event.key)) {
        event.preventDefault();
      }
    });
  });