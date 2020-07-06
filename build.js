const browserSync = require('browser-sync').create();
const c = require('ansi-colors');
const fs = require('fs');
const terser = require('terser');
const csso = require('csso');

// Enabled/Disables browserSync live reloading rather than just building once
const DEVMODE = process.argv.slice(2).includes('--watch');

/**
 * Minify the JS bundle.
 * @return {object} Output code from terser.minify
 */
function minifyJS() {
    const startTime = Date.now();
    const options = {
        compress: {
            passes: 2,
            unsafe: true,
            unsafe_arrows: true,
            unsafe_comps: true,
            unsafe_math: true,
            // unsafe_proto: true,
            booleans_as_integers: true
        },
        mangle: {
            properties: {
                keep_quoted: true,
                reserved: [ 'game' ],
            }
        },
        module: true
    };

    console.log('Minifying JS...');

    let code = fs.readFileSync('src/main.js', 'utf8');

    const result = terser.minify(code, options);

    if (result.error) {
        console.error('Terser minify failed: ', result.error.message);
        return false;
    }

    // Don't wrap the game in a function
    // The 2nd replace doesn't use $, in case the closing tag isn't at the end.
    // - That does make it risky, as those chars might be somewhere else too.
    result.code = result.code.replace(/^\!function\(\){/, '');
    result.code = result.code.replace(/}\(\);/, '');

    return result.code;
}

function minifyCSS() {
  const css = fs.readFileSync('src/style.css', 'utf8');
  return csso.minify(css).css;
}

function inline(minifiedJS, minifiedCSS) {
    const startTime = Date.now();
    const html = fs.readFileSync('src/index.html', 'utf8').trim();
    console.log('Inlining JS...');

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
