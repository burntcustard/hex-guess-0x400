const browserSync = require('browser-sync').create();
const c = require('ansi-colors');
const fs = require('fs');
const terser = require('terser');

/**
 * Formats a duration number (ms) into a nice looking string with ansi-colors
 * @param  {number} duration Duration in milliseconds
 * @return {string}          Nicely formatted color string
 */
function formatMs(duration) {
    return c.magentaBright(duration.toString().padStart(4, ' ') + ' ms');
}

/**
 * Console logs a duration (in milliseconds), a fancy arrow char, and a string
 * @param  {number} duration   [description]
 * @param  {string} outputFile [description]
 */
function logOutput(duration, outputFile) {
    console.log(`${formatMs(duration)} ↪ ${outputFile}`);
}

/**
 * Minify the JS bundle. Includes using preprocess to remove debug messages.
 * @return {object} Output code from terser.minify
 */
function minify() {
    const startTime = Date.now();
    const options = {
        compress: {
            passes: 2,
            unsafe: true,
            unsafe_arrows: true,
            unsafe_comps: true,
            unsafe_math: true,
            // unsafe_proto: true, // ~ 3 bytes
            booleans_as_integers: true // ~ 20 bytes if really needed
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

    // fs.writeFileSync('dist/main.min.js', result.code);
    // if (result.map) {
    //     fs.writeFileSync('dist/main.min.js.map', result.map);
    // }

    //fs.writeFileSync('cacheFile', JSON.stringify(options.nameCache), "utf8");

    //logOutput(Date.now() - startTime, 'dist/main.min.js');

    return result.code;
}

function inline(minifiedJS) {
    var startTime = Date.now();

    console.log('Inlining JS...');

    const html = fs.readFileSync('src/index.html', 'utf8');

    fs.writeFileSync(
        'index.html',
        // Prepend <body> so browsersync can insert its script in dev mode
        `${html.trim()}<script>${minifiedJS}</script>`
    );

    logOutput(Date.now() - startTime, 'index.html');

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
    const limitStr = ((limit / 1024).toFixed(0) + ' KB').padEnd(5, ' ');

    var output = usedStr + ' / ' + limitStr +  ' [';
    for (let i = 0; i < barWidth; i++) {
        output += `${i < usedBarWidth ? '#' : c.gray('-')}`;
    }
    output += '] ';
    output += usedPercent > 99 ? c.red(usedPercent + '%') : usedPercent + '%';

    console.log(output);
}

let fsWait = false;
fs.watch('src', (event, filename) => {
  if (filename) {
    if (fsWait) return;
    fsWait = setTimeout(() => {
      fsWait = false;
    }, 100);
    console.log(`${filename} file Changed`);
    inline(minify());
    drawSize(fs.statSync('index.html')['size']);
  }
});

let livereload = () => {
  // On first run, start a web server
  browserSync.init({
    server: 'dist'
  });

  // On future runs, reload the browser
  livereload = () => {
    browserSync.reload('dist/index.html');
    return true;
  }

  return true;
};

inline(minify());
drawSize(fs.statSync('index.html')['size']);
