const fs = require('fs');
const path = require('path');

const dependencyMap = {
  'www/external/js/ionic.bundle.min.js': 'ionic@1.3.5',
  'www/external/js/angular-translate.min.js': 'angular-translate@2.19.0',
  'www/external/js/Chart2.min.js': 'chart.js@2.9.4',
  'www/external/js/moment-with-locales.min.js': 'moment@2.29.4',
  'www/external/js/localforage.min.js': 'localforage@1.10.0',
  'www/external/js/angular-cookies.min.js': 'angular-cookies@1.8.3',
  'www/external/js/angular-touch.min.js': 'angular-touch@1.8.3'
};

function updateIndexHtml() {
  const indexPath = path.join(__dirname, '../www/index.html');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  Object.keys(dependencyMap).forEach(oldPath => {
    const scriptTag = `<script src="${oldPath}"></script>`;
    content = content.replace(scriptTag, '<!-- Bundled by webpack -->');
  });
  
  fs.writeFileSync(indexPath, content);
  console.log('Updated index.html with bundled dependencies');
}

updateIndexHtml();
