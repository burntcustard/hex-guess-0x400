function newHex() {
  const r = Math.floor(Math.random() * 255).toString(16);
  const g = Math.floor(Math.random() * 255).toString(16);
  const b = Math.floor(Math.random() * 255).toString(16);
  return '#' + r + g + b;
}

var score = 0;

function newRound() {
  const selectedIndex = Math.floor(Math.random() * 3);
  var test = 2;
  document.querySelector('div').innerHTML = '';

  for (let i = 0; i < 3; i++) {
    const hex = newHex();

    var button = document.createElement('button');
    button.style.background = hex;

    if (i === selectedIndex) {
      document.querySelector('h1').innerHTML = `score ${score} ${hex}`;
      button.addEventListener('click', () => {
        score++;
        newRound();
      });
    } else {
      button.addEventListener('click', (e) => {
        e.currentTarget.disabled = true;
      });
    }

    document.querySelector('div').appendChild(button);
  }
}

newRound();
