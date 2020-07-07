function newHex() {
  let r = Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
  let g = Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
  let b = Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
  return '#' + r + g + b;
}

var streak = 1;

function newRound() {
  let selectedIndex = Math.floor(Math.random() * 5);
  streak = streak || 1;
  document.querySelector('div').innerHTML = '';
  document.querySelector('p').innerHTML = 'Streak: ' + (streak - 1);

  for (let i = 0; i < 5; i++) {
    let hex = newHex();
    let button = document.createElement('button');
    button.style.background = hex;

    if (i == selectedIndex) {
      document.querySelector('h1').innerHTML = hex;
      button.onclick = function() {
        this.style.color = '#000';
        this.style.background = '#fff';
        if (streak) {
          streak++;
          document.querySelector('p').innerHTML = 'Streak: ' + (streak - 1);
        }
        window.setTimeout(() => newRound(), 1500);
      };
    } else {
      button.onclick = function() {
        this.style.color = '#000';
        this.style.background = '#fff';
        this.disabled = true;
        streak = NaN;
        document.querySelector('p').innerHTML = 'Streak: broken!';
      };
    }

    document.querySelector('div').append(button);
  }
}

newRound();
