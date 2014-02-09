var redis = require("redis"),
    ffmpeg = require('fluent-ffmpeg'),
    async = require('async'),
    request = require('request'),
    fs = require('fs'),
    comb = require("comb"),
    client = redis.createClient(),
    exec = require('child_process').exec,
    channel = redis.createClient(), mkdirp = require('mkdirp');

var K_T_PER = "VOD_PER_";
var K_T_STAT = "VOD_STAT_";
var K_T_DOWNLOAD_STAT = "DOWNLOAD_S";
var sformat = comb.string.format;

client.on("error", function (err) {
    console.log("Error " + err);
});
channel.on("error", function (err) {
    console.log("Error " + err);
});
function print() {
}
function main() {
    console.log("liaoningtv-convert is start");
    channel.on("message", function (channel, data) {
        console.log(data);
        var task = JSON.parse(data);
        if (channel == "task" && !task) {
            return;
        }

        downloadFile(task);

    });
    channel.subscribe("task");
}

function downloadFile(task) {
    var strTarget = comb.date.format(new Date(), "yyyyMMddhhmmss");
    strTarget = sformat("/vod/%s%s.mp4", [strTarget, random(4)])
    var r = fs.createWriteStream(strTarget);
    r.on('close', function () {
        startConvert(strTarget, task.target, task.path);
    })

    request(task.url).pipe(r);
}

function startConvert(path, target, targetPath) {
    async.series([
        function (cb) {
            //1080p
            convert('1920x1080', path, target, targetPath, cb);
        },
        function (cb) {
            //720p
            convert('1280x720', path, target, targetPath, cb);
        },
        function (cb) {
            //480p
            convert('720x480', path, target, targetPath, cb);
        }
    ], function (err, results) {
        exec("rm -rf " + path, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    })
}

function convert(size, path, target, targetPath, cb) {
    mkdirp(targetPath, function (err) {
        if (err) console.error(err)
    });
    var targetFilename = sformat("%s%s%s.mp4", [targetPath, target, size])
    setStat(target, size, 0);
    var proc = new ffmpeg({ source: path, timeout: 9999 })
        .withVideoBitrate(1024)
        .withVideoCodec('libx264')
        .withAspect('16:9')
        .withSize(size)
        .withFps(24)
        .withAudioBitrate('64k')
        .withAudioCodec('libmp3lame')
        .onProgress(function (progress) {
            setPercent(target, size, progress.percent.toFixed(2))
        })
        .toFormat('mp4')
        .saveToFile(targetFilename, function (stdout, stderr) {
            setPercent(target, size, 100)
            setStat(target, size, 1);
            cb();
        });
}
function setStat(target, size, stat) {
    client.set(K_T_STAT + target + "_stat", size, stat, print);
}
function setDownloadStat(target) {
    //client.hset(K_T_DOWNLOAD_STAT + target + "_stat", size, stat, print);
}
function setPercent(target, size, percent) {
    client.hset(K_T_PER + target, size, percent, print);
}
function random(n) {
    var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    var res = "";
    for (var i = 0; i < n; i++) {
        var id = Math.ceil(Math.random() * 35);
        res += chars[id];
    }
    return res;
}
main();