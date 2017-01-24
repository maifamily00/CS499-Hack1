var express = require('express')
var AWS = require('aws-sdk')
var s3 = new AWS.S3()
var fs = require('fs')
var chokidar = require('chokidar');

var myBucket = '499hack1';
var app = express()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.sendfile('index.html')
})

app.get('/allFiles', function(req, res){
	var params = {
	  Bucket: myBucket	  
	};
	s3.listObjects(params, 	function(err, data){	  
	  for(var i = 0; i < data.Contents.length; i++) {
	  	data.Contents[i].Url = 'https://s3-us-west-1.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;
	  }
	  res.json(data.Contents);
	})
})

var watcher = chokidar.watch('/home/ec2-user/Hack1', {
  ignored: /[\/\\]\./, persistent: true
});

var log = console.log.bind(console);

watcher
  .on('add', function(path) { log('File', path, 'has been added'), uploadToS3(path); })
  .on('change', function(path) { log('File', path, 'has been changed'), updateS3(path); })
  .on('unlink', function(path) { log('File', path, 'has been removed'), removeFromS3(path); });

function uploadToS3(FilePath){
	    fs.readFile(FilePath, function (err,data) {
		params = {Bucket: myBucket, Key: FilePath, Body: data};
	    s3.putObject(params, function(err, data) {
	         if (err) {
	             console.log(err)
	         } else {
	             console.log("Successfully uploaded data to " + myBucket, data);
	         }
	    });
	});
}

function removeFromS3(FilePath){
	  params = {Bucket: myBucket, Key: FilePath};
	  s3.deleteObject(params, function(err,data) {
	  if (err) {
                     console.log(err)
                 } else {
                     console.log("Successfully removed data from " + myBucket, data);
                 }
	  });
}

function updateS3(FilePath){
	 params = {Bucket: myBucket, Key: FilePath};
          s3.deleteObject(params, function(err,data) {
          if (err) {
                     console.log(err)
                 } else {
			uploadToS3(FilePath);
		}
          });
}

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
