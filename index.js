#!/usr/bin/env node
const program = require('commander');
const request = require('request');
const fs = require('fs');
const unzip = require('unzip');
const path = require('path');
const mkdir = require('mkdirp');
const rimraf = require('rimraf');
const spawn = require('child_process').spawn;

const download = (url, output, cb) => {
  console.log('======= download =======')
  request({url: url, encoding: null}, function(err, resp, body) {
    if(err) throw err;
    fs.writeFile(output, body, function(err) {
      cb();
    });
  });
};

const projectStep = (projectName) => {
  console.log(`======= npm install =======`);
  const comm_install = spawn(`cd ${process.cwd()}/${projectName} && npm install`, {
    shell: true
  });
  comm_install.stdout.on('data', function (data) {
    console.log(data.toString());
  });
  comm_install.on('exit', function (exitCode) {
    console.log(`======= npm start =======`);
    const comm_start = spawn(`cd ${process.cwd()}/${projectName} && npm start`, {
      shell: true
    });
    comm_start.stdout.on('data', function (data) {
      console.log(data.toString());
    });
  });
}

const unzipStep = (output, projectName) => {
  console.log('======= unzip =======')
  fs.createReadStream(`${process.cwd()}/${output}`)
    .pipe(unzip.Parse())
    .on('entry', function (entry) {

      let fileName = entry.path;
      const type = entry.type;

      if (type==='File') {

        const fullPath = `${process.cwd()}/${path.dirname(fileName)}`;
        fileName = path.basename( fileName );
        mkdir.sync(fullPath);
        entry.pipe(fs.createWriteStream( fullPath + '/' + fileName ));

      } else {
        entry.autodrain();
      }
    })
    .on('close', function() {
      rimraf(`./${output}`, () => {});
      fs.rename(`${process.cwd()}/simple_react_startkit-master`, `${process.cwd()}/${projectName}`, function (err) {
        if (err) throw err;
        projectStep(projectName);
      });
    })
}

// Main
program
  .version('0.1.0')
  .option('init <projectName>', 'initialize react project')
  .action(option => {
    if (!option.init) {
      program.outputHelp();  // 輸出說明
      process.exit();        // 關閉程式
      return;
    }
    const url = 'https://github.com/ReactMaker/simple_react_startkit/archive/master.zip';
    const output = "master.zip";
    const projectName = option.init;

    download(url, output, () => unzipStep(output, projectName));
  })
  
program.parse(process.argv);
