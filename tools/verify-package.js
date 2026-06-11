#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const forbiddenRepositoryPaths = [
  'source/libs',
  'source/images/SitePreview.png',
  'source/images/mobile1.png',
  'source/images/mobile2.png',
  'docs/starter/source/robots.txt'
];
const forbiddenPackagePrefixes = [
  'test/',
  'tools/',
  '.tmp/',
  '.github/',
  'node_modules/'
];
const forbiddenPackageFiles = new Set([
  '.stylelintrc.json',
  'eslint.config.js',
  'package-lock.json'
]);
const requiredPackageFiles = [
  'package.json',
  'LICENSE',
  'README.md',
  'README_zh-CN.md',
  '_config.yml',
  '_config.yml.example',
  '_vendors.yml',
  'docs/starter/source/about/index.md',
  'docs/starter/scaffolds/post.md',
  'layout/layout.ejs',
  'source/js/main.js',
  'source/css/style.styl'
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const relativePath of forbiddenRepositoryPaths) {
  assert(!fs.existsSync(path.join(repoRoot, relativePath)), `Forbidden repository path exists: ${relativePath}`);
}

const packOutput = execFileSync('npm', ['pack', '--json', '--dry-run'], {
  cwd: repoRoot,
  encoding: 'utf8'
});
const [pack] = JSON.parse(packOutput);
const files = pack.files.map(file => file.path);
const fileSet = new Set(files);

for (const requiredFile of requiredPackageFiles) {
  assert(fileSet.has(requiredFile), `Package dry-run is missing required file: ${requiredFile}`);
}

for (const file of files) {
  assert(!forbiddenPackageFiles.has(file), `Package dry-run includes development file: ${file}`);
  assert(
    !forbiddenPackagePrefixes.some(prefix => file.startsWith(prefix)),
    `Package dry-run includes development path: ${file}`
  );
}
