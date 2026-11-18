const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function removeIfExists(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  } catch (e) {}
}

const androidRes = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const customRes = path.join(__dirname, 'android-res');

if (fs.existsSync(androidRes) && fs.existsSync(customRes)) {
  // Remove default Capacitor vector launcher drawables that override PNGs
  removeIfExists(path.join(androidRes, 'drawable', 'ic_launcher_background.xml'));
  removeIfExists(path.join(androidRes, 'drawable', 'ic_launcher_foreground.xml'));
  removeIfExists(path.join(androidRes, 'drawable-v24', 'ic_launcher_foreground.xml'));
  removeIfExists(path.join(androidRes, 'mipmap-anydpi-v26', 'ic_launcher.xml'));
  removeIfExists(path.join(androidRes, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'));

  // Copy CHATEAMS outer launcher icons and adaptive icon XML
  copyRecursiveSync(customRes, androidRes);
  console.log('[CHATEAMS] Applied outer launcher icons to Android res/');
}

// Bump versionCode & versionName in android/app/build.gradle so Android launcher refreshes icon cache
const gradleFile = path.join(__dirname, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradleFile)) {
  let gradle = fs.readFileSync(gradleFile, 'utf8');
  gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 230');
  gradle = gradle.replace(/versionName\s+"[^"]*"/, 'versionName "2.3.0"');
  fs.writeFileSync(gradleFile, gradle, 'utf8');
  console.log('[CHATEAMS] Updated versionCode 230 & versionName 2.0.0 in build.gradle');
}
