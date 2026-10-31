const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src').filter((f) => f.endsWith('.tsx'));
files.forEach((f) => {
  let content = fs.readFileSync(f, 'utf8');
  const regex = /const message = err\?\.response\?\.data\?\.message \|\| err\?\.response\?\.data\?\.error \|\| (.*);/g;
  if (regex.test(content)) {
    content = content.replace(regex, 'const message = err?.message || err?.error || $1;');
    fs.writeFileSync(f, content);
    console.log('Fixed ' + f);
  }
  
  // also check for (err: any) -> error: any if some use error
  const regex2 = /const message = error\?\.response\?\.data\?\.message \|\| error\?\.response\?\.data\?\.error \|\| (.*);/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, 'const message = error?.message || error?.error || $1;');
    fs.writeFileSync(f, content);
    console.log('Fixed ' + f);
  }
});
