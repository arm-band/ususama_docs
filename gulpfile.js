/**
 * gulp task
 *
 * @author    アルム＝バンド
 * @copyright Copyright (c) アルム＝バンド
 */

var gulp = require("gulp");
//全般
var watch = require("gulp-watch");
var plumber = require("gulp-plumber"); //待機
var notify = require("gulp-notify"); //標準出力
//sass
var sass = require("gulp-sass"); //sass
var autoprefixer = require("gulp-autoprefixer");
//img
var imagemin = require("gulp-imagemin"); //画像ロスレス圧縮
//js
var uglify = require("gulp-uglify"); //js圧縮
var concat = require("gulp-concat"); //ファイル結合
var rename = require("gulp-rename"); //ファイル名変更
//ejs
var ejs = require("gulp-ejs");
var data = require("gulp-data"); //gulp-ejs内でファイル名を参照できるようにする
//file operation
var fs = require("fs");
//reload
var connect = require("gulp-connect-php"); //proxy(phpファイル更新時リロード用)
var browserSync = require("browser-sync"); //ブラウザリロード
//styleguide
var frontnote = require("gulp-frontnote");
//RSS
var RSS = require("rss");
//yaml
var yaml = require("yaml").default;
//marked
var marked = require("marked");
//front-matter
var fm = require("front-matter");


//path difinition
var dir = {
  assets: {
    jquery    : './node_modules/jquery/dist',
    easing    : './node_modules/jquery.easing',
    bootstrap : './node_modules/bootstrap-honoka/dist/js',
    bowser    : './node_modules/bowser'
  },
  src: {
    ejs       : './src/ejs',
    scss      : './src/scss',
    assets    : '/assets',
    js        : './src/js',
    img       : './src/img',
    favicon   : './src/favicon'
  },
  config: {
    dir       : './src/config',
    config    : '/config.yml',
    commonvar : '/commonvar.yml'
  },
  contents: {
    dir       : './src/contents'
  },
  dist: {
    html      : './dist',
    news      : './dist/news',
    articles  : './dist/news/articles',
    css       : './dist/css',
    js        : './dist/js',
    img       : './dist/img'
  },
  sg: {
    html      : './sg/dist',
    md        : './readme.md',
    css       : '../../dist/css',
    js        : '../../dist/js',
    img       : '../../dist/img',
    favicon   : '../../dist/favicon',
    canceller : '../src/css',
    template  : './sg/src/ejs'
  }
};

//RSS Feed
var rssFeed = (config) => {
    var datetime = formatDate("", "");

    var feed = new RSS({
        title: config.commons.sitename,
        description: config.param["index"].description,
        feed_url: config.commons.url + "rss.xml",
        site_url: config.commons.url,
        image_url: config.commons.url + "img/" + config.param["index"].ogpimage,
        managingEditor: config.commons.author,
        webMaster: config.commons.author,
        copyright: config.commons.year + " " + config.commons.author,
        language: "ja",
        pubDate: datetime,
        ttl: "60"
    });

    return feed;
}
var feedItem = (feed, config, attributes) => {
    feed.item({
        title:  attributes.title,
        description: attributes.excerpt,
        url: config.commons.url.slice(0, -1) + config.commons.baseurl + "news/articles/" + articleURL(attributes) + ".html",
        author: config.commons.author,
        date: String(attributes.date)
    });
    return feed;
}

//yamlファイル取得
var getConfig = () => {
    var file = fs.readFileSync(dir.config.dir + dir.config.config, "utf8");
    return yaml.parse(file);
}
var getCommonVar = () => {
    var file = fs.readFileSync(dir.config.dir + dir.config.commonvar, "utf8");
    return yaml.parse(file);
}

//記事一覧をファイル名降順で取得
var getArticles = (directory) => {
    var fileList = fs.readdirSync(directory);
    //ファイル名(拡張子なし)でソート
    fileList = fileList.map(fn => {
        return {
            fn: fn,
            noex: zeroPadding(parseInt(fn.split('.')[0]))
        }
    });
    return fileList.sort((a, b) => b.noex - a.noex);
}
//記事ページのURLを生成
var articleURL = (attributes) => {
    var urlTitle = attributes.title;
    urlTitle = urlTitle.replace(/\./g, "_");
    var datetime = formatDate(attributes.date, "ymd");
    var url = `releasenote_${urlTitle}-${datetime}`;
    return url;
}
//記事一覧を数字で管理すると桁数が異なるときに人間的な順番と機械的な順番が異なってしまうのを防ぐためにゼロパディング
var zeroPadding = (num) => {
    var val = Math.abs(num); //絶対値に変換
    var length = val.toString().length; //文字列に変換して長さを取得、桁数とする
    return (Array(length).join("0") + num).slice(-length);
}
//日付のフォーマット
var formatDate = (dateObj, output) => {
    var day;
    if(String(dateObj).length > 0) {
        day = new Date(dateObj);
    }
    else {
        day = new Date();
    }
    var y = day.getFullYear();
    var m = day.getMonth() + 1;
    var d = day.getDate();
    var hr = day.getHours();
    var mt = day.getMinutes();
    var sc = day.getSeconds();
    if (m < 10) {
        m = "0" + m;
    }
    if (d < 10) {
        d = "0" + d;
    }

    var datetime;
    if(output === "ymd") {
        datetime = `${y}${m}${d}`;
    }
    else {
        datetime = y + "-" + m + "-" + d + "T" + hr + ":" + mt + ":" + sc + "+09:00"
    }

    return datetime;
}

//scssコンパイルタスク
gulp.task("yaml2sass", done => {
    var str = "$" + fs.readFileSync(dir.config.dir + dir.config.commonvar, { encoding: "UTF-8" }).replace(/\r\n/g, ";\r\n$");
    str = str.replace(/\"/g, "");
    str = str + ";"; //最後だけ改行がないので;を付ける
    fs.writeFileSync(`${dir.src.scss}/util/_var.scss`, str);
    done();
});
//scssコンパイルタスク
gulp.task("sass", () => {
    return gulp.src([`${dir.src.scss}/**/*.scss`, `!${dir.src.scss}${dir.src.assets}/**/*.scss`])
        .pipe(plumber())
        .pipe(sass({outputStyle: "compressed"}).on("error", sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 version', 'iOS >= 8.1', 'Android >= 4.4'],
            cascade: false
        }))
        .pipe(gulp.dest(dir.dist.css));
});

//画像圧縮
gulp.task("imagemin", () => {
    return gulp.src(`${dir.src.img}/**/*.+(jpg|jpeg|png|gif|svg)`)
        .pipe(imagemin())
        .pipe(gulp.dest(dir.dist.img));
});

//js圧縮&結合&リネーム
gulp.task("js.concat", () => {
    return gulp.src([`${dir.assets.jquery}/jquery.min.js`, `${dir.assets.bootstrap}/bootstrap.bundle.min.js`, `${dir.assets.easing}/jquery.easing.js`, `${dir.assets.bowser}/bowser.js`])
        .pipe(plumber())
        .pipe(concat("lib.js"))
        .pipe(gulp.dest(`${dir.src.js}/concat/`)); //srcとdistを別ディレクトリにしないと、自動でタスクが走る度にconcatしたものも雪だるま式に追加されていく
});
gulp.task("js.uglify.lib", gulp.series(gulp.parallel("js.concat"), () => { //第2引数に先に実行して欲しい js.concat を指定する
    return gulp.src(`${dir.src.js}/concat/lib.js`)
        .pipe(plumber())
        .pipe(uglify({output: {comments: "some"}}))
        .pipe(rename(`${dir.dist.js}/lib.min.js`))  // 出力するファイル名を変更
        .pipe(gulp.dest("./"));
}));
gulp.task("js.uglify.app", () => {
    return gulp.src(`${dir.src.js}/index.js`)
        .pipe(plumber())
        .pipe(uglify({output: {comments: "some"}}))
        .pipe(rename(`${dir.dist.js}/app.min.js`))
        .pipe(gulp.dest("./"));
});
//上記をまとめておく
gulp.task("js", gulp.parallel("js.uglify.lib", "js.uglify.app"));

//ejs
gulp.task("commons.ejs", () => {
    var config = getConfig();
    var commonVar = getCommonVar();
    var fileList = getArticles(`${dir.contents.dir}/`);
    var newsBlock = [];
    var newsLength = config.param.index.newscount;
    if(fileList.length <= config.param.index.newscount) {
        newsLength = fileList.length;
    }
    for(var i = 0; i < newsLength; i++) { //新着情報の件数
        var fileData = fs.readFileSync(`${dir.contents.dir}/${fileList[i].fn}`, "utf8");
        var content = fm(fileData);
        var attributes = content.attributes;
        newsBlock.push(attributes); //件数分スタック
    }
    return gulp.src(
        [`${dir.src.ejs}/**/*.ejs`, `!${dir.src.ejs}/**/_*.ejs`, `!${dir.src.ejs}/news.ejs`, `!${dir.src.ejs}/article.ejs`] //_*.ejs(パーツ)とnews.ejs(別タスクで定義)はhtmlにしない
    )
    .pipe(plumber())
    .pipe(data((file) => {
        return { "filename": file.path }
    }))
    .pipe(ejs({ config, newsBlock, commonVar }))
    .pipe(rename({ extname: ".html" }))
    .pipe(gulp.dest(dir.dist.html));
});

//新着情報専用のejsタスク
gulp.task("news.ejs", done => {
    var name = "news"; //テンプレート・生成するファイル名
    var config = getConfig();
    var commonVar = getCommonVar();
    var defaultFile = `${dir.src.ejs}/article.ejs`; //記事デフォルトテンプレート
    var tempArticleFile = defaultFile; //記事テンプレート
    var tempNewsFile = `${dir.src.ejs}/${name}.ejs`; //新着一覧テンプレート
    var fileList = getArticles(`${dir.contents.dir}/`);
    var pages = 1; //ページカウンタ
    var pageLength = Math.ceil(fileList.length / config.param.news.pagination); //ページの最大数
    var feed = rssFeed(config); //RSS
    var newsBlock = []; //1ページ辺りの記事のオブジェクト

    for(var i = 0; i < fileList.length; i++) { //新着情報の件数
        var fileData = fs.readFileSync(`${dir.contents.dir}/${fileList[i].fn}`, "utf8");
        var content = fm(fileData);
        var attributes = content.attributes;
        newsBlock.push(attributes); //件数分スタック
        /* 各記事ファイルを生成
        *************************************** */
        //テンプレートファイルの選択
        if(attributes.layout.length > 0) {
            tempArticleFile = `${dir.src.ejs}/${attributes.layout}`;
        }
        else {
            tempArticleFile = `${dir.src.ejs}/article.ejs`;
        }

        //記事生成
        var body = marked(content.body);
        gulp.src(tempArticleFile)
            .pipe(plumber())
            .pipe(data((ejsFile) => {
                return { "filename": ejsFile.path }
            }))
            .pipe(ejs({ config, attributes, body, commonVar, name, pages }))
            .pipe(rename(`${articleURL(attributes)}.html`))
            .pipe(gulp.dest(dir.dist.articles));

        if(config.param["index"].newscount > i) { //件数はconfig.param["index"].newscountの件数とする
            feedItem(feed, config, attributes); //RSS
        }

        if(i % config.param.news.pagination == (config.param.news.pagination - 1)) { //記事件数を1ページ当たりの件数で割った剰余が(1ページ当たりの件数-1)の場合はhtmlを生成
            gulp.src(tempNewsFile)
            .pipe(plumber())
            .pipe(data((file) => {
                return { "filename": file.path }
            }))
            .pipe(ejs({ config, newsBlock, commonVar, name, pages, pageLength }))
            .pipe(rename(`${name}${pages}.html`))
            .pipe(gulp.dest(dir.dist.news));

            newsBlock = []; //空にする
            pages++; //カウントアップ
        }
    }

    if(newsBlock.length > 0) {
        gulp.src(tempNewsFile)
        .pipe(plumber())
        .pipe(data((file) => {
            return { "filename": file.path }
        }))
        .pipe(ejs({ config, newsBlock, commonVar, name, pages, pageLength }))
        .pipe(rename(`${name}${pages}.html`))
        .pipe(gulp.dest(dir.dist.news));
    }

    //RSS
    var xml = feed.xml({indent: true});
    fs.writeFileSync(`${dir.dist.html}/rss.xml`, xml);

    done();
});

//上記をまとめておく
gulp.task("ejs", gulp.parallel("commons.ejs", "news.ejs"));

//favicon
gulp.task("favicon", () => {
    return gulp.src(
        [`${dir.src.favicon}/**/*`]
    )
    .pipe(plumber())
    .pipe(gulp.dest(dir.dist.html));
});

//自動リロード
gulp.task("connect-sync", () => {
/*  connect.server({ //php使うときはこっち
        port: 8001,
        base: dir.dist.html,
        bin: "D:/xampp/php/php.exe",
        ini: "D:/xampp/php/php.ini"
    }, () =>{
        browserSync({
            proxy: "localhost:8001",
            open: 'external'
        });
    });*/
    browserSync({
        server: {
            baseDir: dir.dist.html
        },
        open: 'external'
    });

    watch(`${dir.src.ejs}/**/*.ejs`, gulp.series("ejs", browserSync.reload));
    watch(`${dir.contents.dir}/**/*.md`, gulp.series("ejs", browserSync.reload));
//    watch(dir.dist.html + "/**/*.php", gulp.series(browserSync.reload)); //php使うときはこっち
    watch(`${dir.src.favicon}/**/*`, gulp.series("favicon", browserSync.reload));
    watch([`${dir.src.scss}/**/*.scss`, `!${dir.src.scss}/util/_var.scss`], gulp.series("sass", browserSync.reload));
    watch(`${dir.src.img}/**/*.+(jpg|jpeg|png|gif|svg)`, gulp.series("imagemin", browserSync.reload));
    watch(`${dir.src.js}/*.js`, gulp.series("js", browserSync.reload));
    watch([`${dir.config.dir}/**/*.yml`], gulp.series(gulp.parallel("ejs", gulp.series("yaml2sass", "sass"), "js"), browserSync.reload));
});

//styleguide(FrontNote)
gulp.task("styleguide", () => {
    return gulp.src(dir.src.scss + "/**/*.scss") // 監視対象のファイルを指定
        .pipe(frontnote({
            out: dir.sg.html,
            title: getConfig().commons.sitename,
            css: [`${dir.sg.css}/contents.css`, `${dir.sg.css}/index.css`, `${dir.sg.canceller}/fncanceller.css`, "https://fonts.googleapis.com/css?family=Dancing+Script", "https://fonts.googleapis.com/earlyaccess/sawarabimincho.css", "https://use.fontawesome.com/releases/v5.2.0/css/all.css"],
            script: [`${dir.sg.js}/lib.min.js`, `${dir.sg.js}/app.min.js`],
            template: `${dir.sg.template}/index.ejs`,
            overview: dir.sg.md,
            params: { "commonVar": getCommonVar() }
        }));
});

gulp.task("server", gulp.series("connect-sync"));
gulp.task("build", gulp.parallel(gulp.series("yaml2sass", "sass"), "ejs", "js", "imagemin", "favicon"));

//gulpのデフォルトタスクで諸々を動かす
gulp.task("default", gulp.series("build", "server"));