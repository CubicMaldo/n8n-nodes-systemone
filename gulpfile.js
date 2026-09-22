const { src, dest } = require('gulp');

function copyIcons() {
  return src(['nodes/**/*.{svg,png,json}']).pipe(dest('dist/nodes'));
}

exports['copy:icons'] = copyIcons;
exports.default = copyIcons;

