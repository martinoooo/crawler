var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var http = require("http"),
	url = require("url"),
	superagent = require("superagent"),
	async = require("async"),
	eventproxy = require('eventproxy');

var ep = new eventproxy();
var pageUrls = [];
var urlsArray = [];

for (var i = 0; i <= 9; i++) {
	pageUrls.push('https://movie.douban.com/top250?start=' + i * 25 + '&filter=');
}

pageUrls.forEach(function(pageUrl) {
	superagent.get(pageUrl)
		.end(function(err, pres) {
			var $ = cheerio.load(pres.text);
			var curPageUrls = $('.grid_view li .hd a');

			for (var i = 0; i < curPageUrls.length; i++) {
				var articleUrl = curPageUrls.eq(i).attr('href');
				urlsArray.push('\n' + articleUrl);
				// 相当于一个计数器
				ep.emit('BlogArticleHtml', articleUrl);
			}
		});
});

ep.after('BlogArticleHtml', pageUrls.length * 25, function(articleUrls) {
	// 当所有 'BlogArticleHtml' 事件完成后的回调触发下面事件
	// ...
	console.log('urlLength is' + urlsArray.length);
	fs.appendFile('url.txt', urlsArray, 'utf-8', function(err) {
		if (err) throw err;
		else console.log('大体信息写入成功')
	});

	var curCount = 0;
	var reptileMove = function(url, callback) {
		//延迟毫秒数
		var delay = parseInt((Math.random() * 30000000) % 1000, 10);
		curCount++;
		console.log('现在的并发数是', curCount, '，正在抓取的是', url);
		var url2 = url + 'photos?type=R';
		//setTimeout(function() {
		superagent.get(url2)
			.end(function(err, sres) {
				// 常规的错误处理
				curCount--;
				if (err) {
					//callback(url + 'error', null);
					//return;
				}
				var $ = cheerio.load(sres.text);
				var src = $('.cover a').eq(0).attr('href');
				if (src) {
					getImg(src);
				}
				callback(null, src);
			})
			//}, 5000)
	};

	async.mapLimit(articleUrls, 5, function(url, callback) {
		reptileMove(url, callback);
	}, function(err, result) {
		endDate = new Date();
		console.log(err);
		console.log(result);
		console.log(endDate);
	});
});

function getImg(url) {
	superagent.get(url).end(function(err, docs) {
		var $ = cheerio.load(docs.text); //docs.text就是爬取到的数据，把它经过cheerio转换
		var imgArr = [];
		var title = $('#title-anchor').text();
		var src = $('img').eq(0).attr('src');
		downloadImg(src, title);
	});
}

var dir = './images';
var downloadImg = function(url, filename) {
	request.head(url, function(err, res, body) {
		request(url).pipe(fs.createWriteStream(dir + "/" + filename + '.' + url.split('.')[3]));
	});
};

/*url = 'http://movie.douban.com/subject/25724855/';
var html = '';
html = request('GET', url).getBody().toString();
handleDB(html);

function handleDB(html) {
	var $ = cheerio.load(html); //引入cheerio的方法。这样的引入方法可以很好的结合jQuery的用法。
	var info = $('#info');
	// 获取电影名
	var movieName = $('#content>h1>span').filter(function(i, el) {
		return $(this).attr('property') === 'v:itemreviewed';
	}).text();
	// 获取影片导演名
	var directories = '- 导演：' + $('#info span a').filter(function(i, el) {
		return $(this).attr('rel') === 'v:directedBy';
	}).text();
	// 获取影片演员
	var starsName = '- 主演：';
	$('.actor .attrs a').each(function(i, elem) {
		starsName += $(this).text() + '/';
	});
	// 获取片长
	var runTime = '- 片长：' + $('#info span').filter(function(i, el) {
		return $(this).attr('property') === 'v:runtime';
	}).text();
	// 获取影片类型  
	var kind = $('#info span').filter(function(i, el) {
		return $(this).attr('property') === 'v:genre'
	}).text();
	// 处理影片类型数据
	var kLength = kind.length;
	var kinds = '- 影  片类型：';
	for (i = 0; i < kLength; i += 2) {
		kinds += kind.slice(i, i + 2) + '/';
	}
	// 获取电影评分和电影评分人数
	// 豆瓣
	var DBScore = $('.ll.rating_num').text();
	var DBVotes = $('a.rating_people>span').text().replace(/\B(?=(\d{3})+$)/g, ',');
	var DB = '- 豆  瓣评分：' + DBScore + '/10' + '(' + 'from' + DBVotes + 'users' + ')';
	// IMDBLink
	IMDBLink = $('#info').children().last().prev().attr('href');

	var data = movieName + '\r\n' + directories + '\r\n' + starsName + '\r\n' + runTime + '\r\n' + kinds + '\r\n' + DB + '\r\n';
	// 输出文件
	fs.appendFile('dbmovie.txt', data, 'utf-8', function(err) {
		if (err) throw err;
		else console.log('大体信息写入成功' + '\r\n' + data)
	});
}*/