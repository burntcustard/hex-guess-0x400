const browserSync = require('browser-sync').create();
const c = require('ansi-colors');
const fs = require('fs');
const terser = require('terser');
const csso = require('csso');
const regPack = require('regpack');

// Enabled/Disables browserSync live reloading rather than just building once
const DEVMODE = process.argv.slice(2).includes('--watch');

/**
 * Minify the JS bundle.
 * @return {object} Output code from terser.minify
 */
function minifyJS() {
    const startTime = Date.now();
    const options = {
        terser: {
            compress: {
                passes: 2,
                //unsafe: true,
                //unsafe_arrows: true,
                //unsafe_comps: true,
                //unsafe_math: true,
                //unsafe_proto: true,
                booleans_as_integers: true
            },
            mangle: {
                properties: {
                    keep_quoted: true,
                    reserved: [],
                }
            },
            module: true
        },
        regPack: {
            withMath: false,
            hash2DContext: true,
            hashWebGLContext: false,
            hashAudioContext: false,
            contextVariableName: 'c',
            contextType: parseInt(0),
            reassignVars: true,
            varsNotReassigned: 'abc',
            crushGainFactor: parseFloat(1),
            crushLengthFactor: parseFloat(0),
            crushCopiesFactor: parseFloat(0),
            crushTiebreakerFactor: parseInt(1),
            wrapInSetInterval: false,
            timeVariableName: ''
        }
    };

    let code = fs.readFileSync('src/main.js', 'utf8');

    console.log('Minifying JS (Terser)...');

    const result = terser.minify(code, options.terser);

    if (result.error) {
        console.error('Terser minify failed: ', result.error.message);
        return false;
    }

    // Duplicate the regPack stats console log but with terser stats
    console.log(`stats: ${code.length}B to ${result.code.length}B (-${code.length - result.code.length}B -${((100 / code.length) * (code.length - result.code.length)).toFixed(2)}%)`);

    // Regpack
    console.log('Minifying JS (RegPack)...');
    var bestVal = regPack.cmdRegPack(result.code, options.regPack);

    return bestVal;
}

function minifyCSS() {
  console.log('Minifying CSS');
  const css = fs.readFileSync('src/style.css', 'utf8');
  const minifiedCSS = csso.minify(css).css;

  // Duplicate the regPack stats console log but with csso stats
  console.log(`stats: ${css.length}B to ${minifiedCSS.length}B (-${css.length - minifiedCSS.length}B -${((100 / css.length) * (css.length - minifiedCSS.length)).toFixed(2)}%)`);
  return minifiedCSS;
}

function inline(minifiedJS, minifiedCSS) {
    const startTime = Date.now();
    const html = fs.readFileSync('src/index.html', 'utf8').trim();
    console.log('Inlining...');

    fs.writeFileSync(
        'index.html',
        // Prepend <body> so browsersync can insert its script in dev mode
        `<style>${minifiedCSS}</style>${html}<script>${minifiedJS}</script>`
    );

    return true;
}

/**
 * Draw a fancy zip file size bar with KB and % values
 * @param  {number} used Size of zip file in bytes
 */
function drawSize(used) {
    const limit = 1024;
    const remaining = limit - used;
    const usedPercent = Math.round((100 / limit) * used);
    const barWidth = process.stdout.columns - 26;
    const usedBarWidth = Math.round((barWidth / 100) * usedPercent);
    const usedStr = (used + ' B').padStart(7, ' ');
    const limitStr = (limit + ' B').padEnd(5, ' ');

    var output = usedStr + ' / ' + limitStr +  ' [';
    for (let i = 0; i < barWidth; i++) {
        output += `${i < usedBarWidth ? '#' : c.gray('-')}`;
    }
    output += '] ';
    output += usedPercent > 99 ? c.red(usedPercent + '%') : usedPercent + '%';

    console.log(output);
}

function watch() {
  let fsWait = false;
  fs.watch('src', (event, filename) => {
    if (filename) {
      if (fsWait) return;
      fsWait = setTimeout(() => {
        fsWait = false;
      }, 100);
      console.log(`${filename} file Changed`);
      inline(minifyJS(), minifyCSS());
      livereload();
      drawSize(fs.statSync('index.html')['size']);
    }
  });
}

let livereload = () => {
  // On first run, start a web server
  browserSync.init({
    server: './'
  });

  // On future runs, reload the browser
  livereload = () => {
    browserSync.reload('index.html');
    return true;
  }

  return true;
};

if (DEVMODE) {
  livereload();
  watch();
}
inline(minifyJS(), minifyCSS());
drawSize(fs.statSync('index.html')['size']);
