const fs = require("fs");
const path = require("path");

exports.promiseReadDir = (directory) => {
  return new Promise((resolve, reject) => {
    var absolute_path = path.join(__dirname, directory);
    fs.readdir(absolute_path, (error, files) => {
      if (error) {
        reject(error);
      }
      // files = files.map((file) => {
      //   return file;
      // });
      resolve(files);
    });
  });
};

exports.promiseReadJsonFile = (file) => {
  return new Promise((resolve, reject) => {
    var absolute_path = path.join(__dirname, file);
    fs.readFile(absolute_path, (error, data) => {
      if (error) reject(error);
      resolve(JSON.parse(data));
    });
  });
};
