function newHex() {
  const r = '' + Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
  const g = '' + Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
  const b = '' + Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
  return '#' + r + g + b;
}

var score = 0;

function newRound() {
  const selectedIndex = Math.floor(Math.random() * 5);
  document.querySelector('div').innerHTML = '';
  document.querySelector('p').innerHTML = 'Score: ' + score;

  for (let i = 0; i < 5; i++) {
    var hex = newHex();
    var button = document.createElement('button');
    button.style.background = hex;

    if (i == selectedIndex) {
      document.querySelector('h1').innerHTML = hex;
      button.onclick = function() {
        this.style.color = '#000';
        this.style.background = 'transparent';
        score++;
        window.setTimeout(() => newRound(), 1500);
      };
    } else {
      button.onclick = function() {
        this.style.color = '#000';
        this.style.background = 'transparent';
        this.disabled = true;
      };
    }

    document.querySelector('div').append(button);
  }
}

newRound();
