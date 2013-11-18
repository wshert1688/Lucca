var async = require("async"),
    redis = require("redis"), comb = require("comb"),
    client = redis.createClient(6379, '218.24.198.133');

var K_T_PER = "VOD_PER_";
var K_T_STAT = "VOD_STAT_";
var K_T_DOWNLOAD_STAT = "DOWNLOAD_S";

exports.index = function (req, res) {
    client.keys("VOD_PER*", function (err, data) {
        async.map(data, function (t, cb) {
            client.hgetall(t, function (err, d) {
                cb(err, d);
            });
        }, function (err, results) {
            console.log(results);
            res.render('index', { title: 'LIAONINGTV', d: data, item: results });
        });
    })
};

exports.send = function (req, res) {
    var url = req.query.u;
    var target = comb.date.format(new Date(), "yyyyMMddhhmmss") + random(4);

    client.publish("task", JSON.stringify({target: target, path: "/data/", url: url}));
    res.send({target: target, url: url});
}

exports.stat = function (req, res) {
    var id = req.query.id;
    client.hgetall(K_T_PER + id, function (err, result) {
        res.send({stat: result});
    })

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
