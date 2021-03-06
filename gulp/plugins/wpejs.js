const { src, dest, series, parallel } = require('gulp');
const plumber                         = require('gulp-plumber');
const notify                          = require('gulp-notify');
const rename                          = require('gulp-rename');
const ejs                             = require('gulp-ejs');
const data                            = require('gulp-data');
const replace                         = require('gulp-replace');
const htmlmin                         = require('gulp-htmlmin');
const fs                              = require('fs');
const axios                           = require('axios');
const dir                             = require('../dir');
const functions                       = require('../functions');
const jsConfig                        = require('../jsconfig');
const config = functions.getConfig(dir.config.config);
const plugins = functions.getConfig(dir.config.plugins);
const imagemin = require('../tasks/imagemin');
const parameters = [];

//ejs
const commonsEjs = () => {
    const config = functions.getConfig(dir.config.config);
    const commonVar = functions.getConfig(dir.config.commonvar);
    const plugins = functions.getConfig(dir.config.plugins);

    return src(
        `${dir.src.ejs}/**/*.ejs`,
        {
            ignore: [
                `${dir.src.ejs}/**/_*.ejs`,
                `${dir.plugins.ejs}/**`,
                `${dir.src.ejs}/index.ejs`,
                `${dir.src.ejs}/news.ejs`,
                `${dir.src.ejs}/article.ejs`
            ] //_*.ejs(パーツ)とプラグインとindex,news,article(別タスクで定義)はhtmlにしない
        })
        .pipe(plumber({
            errorHandler: notify.onError({
                message: 'Error: <%= error.message %>',
                title: 'wpejs commonsEjs'
            })
        }))
        .pipe(data((file) => {
            return { 'filename': file.path }
        }))
        .pipe(ejs({ config, commonVar, plugins, parameters }))
        .pipe(rename({ extname: '.html' }))
        .pipe(htmlmin(jsConfig.configHtmlMin))
        .pipe(replace(jsConfig.htmlSpaceLineDel, ''))
        .pipe(dest(dir.dist.html));
};
//トップページ用のejsタスク
const indexEjs = async (done) => {
    const config = functions.getConfig(dir.config.config);
    const commonVar = functions.getConfig(dir.config.commonvar);
    const plugins = functions.getConfig(dir.config.plugins);
    let newsBlock = [];
    let newsLength = config.param.news.indexcount;
    let cntArray = {
        'totalArticles': 0,
        'totalPages': 0
    };
    if(config.param.news.indexcount < 0 || config.param.news.indexcount > 100) {
        console.log('トップページに表示する新着情報の件数は0～100の間で指定してください。');
        return;
    }
    try {
        await axios.get(config.param.news.wpapi + '?per_page=' + newsLength)
            .then(function (response) {
                cntArray.totalArticles = Number(response.headers['x-wp-total']);
                cntArray.totalPages = Number(response.headers['x-wp-totalpages']);
            })
            .catch((error) => {
                throw new Error(error);
            });
    } catch (error) {
        console.error(error);
    }

    if(cntArray.totalArticles <= config.param.news.indexcount || config.param.news.indexcount === 0) {
        newsLength = cntArray.totalArticles;
    }
    try {
        await axios.get(config.param.news.wpapi + '?_embed&per_page=' + newsLength)
            .then(function (response) { //_embedパラメータ付与でアイキャッチ画像のURLが付与される
                const resJSON = response.data;
                for(let i of Object.keys(resJSON)) {
                    const dateStr = resJSON[i].date.split('T')[0];
                    //画像
                    let imgFilePath = 'eyecatch.jpg';
                    if(resJSON[i]['_embedded']['wp:featuredmedia'] !== undefined && resJSON[i]['_embedded']['wp:featuredmedia'] !== null && resJSON[i]['_embedded']['wp:featuredmedia'].length > 0) {
                        const imgFileNameArray = resJSON[i]['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['full']['source_url'].split('/');
                        imgFilePath = imgFileNameArray[imgFileNameArray.length -1].split(/[\?#]+/gi, 1)[0];
                        axios.get(resJSON[i]['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['full']['source_url'], {responseType: 'arraybuffer'})
                            .then(function (response) {
                                fs.writeFileSync(`${dir.src.img}/thumbnails/${imgFilePath}`, new Buffer.from(response.data), 'binary');
                            })
                            .catch((error) => {
                                throw new Error(error);
                            });
                    }

                    const attributes = {
                        'layout': 'article.ejs',
                        'title': resJSON[i].title.rendered,
                        'url': 'wp-' + resJSON[i].id + dateStr,
                        'date': resJSON[i].date_gmt + '+09:00',
                        'thumbnail': imgFilePath,
                        'excerpt': resJSON[i].excerpt.rendered
                    };
                    newsBlock.push(attributes); //件数分スタック
                }
                src(`${dir.src.ejs}/index.ejs`)
                    .pipe(plumber({
                        errorHandler: notify.onError({
                            message: 'Error: <%= error.message %>',
                            title: 'wpejs indexEjs'
                        })
                    }))
                    .pipe(data((file) => {
                        return { 'filename': file.path }
                    }))
                    .pipe(ejs({ config, commonVar, plugins, newsBlock, parameters }))
                    .pipe(rename({ extname: '.html' }))
                    .pipe(htmlmin(jsConfig.configHtmlMin))
                    .pipe(replace(jsConfig.htmlSpaceLineDel, ''))
                    .pipe(dest(dir.dist.html));
            })
            .catch((error) => {
                throw new Error(error);
            });
    } catch (error) {
        console.error(error);
    }
    done();
};
//新着情報専用のejsタスク
const newsEjs = async (done) => {
    const name = 'news'; //テンプレート・生成するファイル名
    const config = functions.getConfig(dir.config.config);
    const commonVar = functions.getConfig(dir.config.commonvar);
    const plugins = functions.getConfig(dir.config.plugins);
    const defaultFile = `${dir.src.ejs}/article.ejs`; //記事デフォルトテンプレート
    let tempArticleFile = defaultFile; //記事テンプレート
    const tempNewsFile = `${dir.src.ejs}/${name}.ejs`; //新着一覧テンプレート
    let pages = 1; //ページカウンタ
    let newsLength = config.param.news.newscount;
    let cntArray = {
        'totalArticles': 0,
        'totalPages': 0
    };
    if(config.param.news.newscount < 0 || config.param.news.newscount > 100) {
        console.log('新着情報の件数は0～100の間で指定してください。');
        return;
    }
    try {
        await axios.get(config.param.news.wpapi + '?per_page=' + newsLength)
            .then(function (response) {
                cntArray.totalArticles = Number(response.headers['x-wp-total']);
                cntArray.totalPages = Number(response.headers['x-wp-totalpages']);
            })
            .catch((error) => {
                throw new Error(error);
            });
    } catch (error) {
        console.error(error);
    }

    if(cntArray.totalArticles <= config.param.news.newscount || config.param.news.newscount <= 0) {
        newsLength = cntArray.totalArticles;
    }
    //RSS
    let feed;
    if(plugins.rss) {
        feed = functions.rssFeed(config, functions);
    }
    let newsBlock = []; //1ページ辺りの記事のオブジェクト
    for(let i = 1; i <= cntArray.totalPages; i++) {
        const pageLength = cntArray.totalPages;
        try {
            let resJSON;
            let cnt;
            await axios.get(config.param.news.wpapi + '?_embed&per_page=' + newsLength + '&page=' + i)
                .then(function (response) { //_embedパラメータ付与でアイキャッチ画像のURLが付与される
                    resJSON = response.data;
                    let attributes = {
                        'layout': 'article.ejs',
                        'title': '',
                        'url': '',
                        'date': '',
                        'thumbnail': 'eyecatch.jpg',
                        'excerpt': ''
                    };
                    for(let j of Object.keys(resJSON)) {
                        const dateStr = resJSON[j].date.split('T')[0];
                        let imgFilePath = 'eyecatch.jpg';
                        if(resJSON[j]['_embedded']['wp:featuredmedia'] !== undefined && resJSON[j]['_embedded']['wp:featuredmedia'] !== null && resJSON[j]['_embedded']['wp:featuredmedia'].length > 0) {
                            const imgFileNameArray = resJSON[j]['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['full']['source_url'].split('/');
                            imgFilePath = imgFileNameArray[imgFileNameArray.length -1].split(/[\?#]+/gi, 1)[0];
                            axios.get(resJSON[j]['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['full']['source_url'], {responseType: 'arraybuffer'})
                                .then(function (response) {
                                    fs.writeFileSync(`${dir.src.img}/thumbnails/${imgFilePath}`, new Buffer.from(response.data), 'binary');
                                })
                                .catch((error) => {
                                    throw new Error(error);
                                });
                        }

                        attributes = {
                            'layout': 'article.ejs',
                            'title': resJSON[j].title.rendered,
                            'url': 'wp-' + resJSON[j].id + dateStr,
                            'date': resJSON[j].date_gmt + '+09:00',
                            'thumbnail': imgFilePath,
                            'excerpt': resJSON[j].excerpt.rendered
                        };
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
                        const articleFileName = functions.articleURL(attributes, functions);
                        const body = resJSON[j].content.rendered;
                        src(tempArticleFile)
                            .pipe(plumber({
                                errorHandler: notify.onError({
                                    message: 'Error: <%= error.message %>',
                                    title: 'wpejs newsEjs: article page'
                                })
                            }))
                            .pipe(data((ejsFile) => {
                                return { 'filename': ejsFile.path }
                            }))
                            .pipe(ejs({ config, commonVar, plugins, attributes, body, name, pages, parameters }))
                            .pipe(rename(`${articleFileName}.html`))
                            .pipe(htmlmin(jsConfig.configHtmlMin))
                            .pipe(replace(jsConfig.htmlSpaceLineDel, ''))
                            .pipe(dest(dir.dist.articles));

                        //RSS
                        if(plugins.rss) {
                            if(config.param.news.indexcount === 0 || config.param.news.indexcount > i) { //件数はconfig.param.news.indexcountの件数とする(0件の場合は全て)
                                functions.feedItem(feed, config, attributes, functions);
                            }
                        }

                        src(tempNewsFile)
                            .pipe(plumber({
                                errorHandler: notify.onError({
                                    message: 'Error: <%= error.message %>',
                                    title: 'wpejs newsEjs: news page'
                                })
                            }))
                            .pipe(data((file) => {
                                return { 'filename': file.path }
                            }))
                            .pipe(ejs({ config, commonVar, plugins, newsBlock, name, pages, pageLength, parameters }))
                            .pipe(rename(`${name}${pages}.html`))
                            .pipe(htmlmin(jsConfig.configHtmlMin))
                            .pipe(replace(jsConfig.htmlSpaceLineDel, ''))
                            .pipe(dest(dir.dist.news));
                        cnt = Number(j);
                    }
                    newsBlock = []; //空にする
                    pages++; //カウントアップ
                })
                .catch((error) => {
                    throw new Error(error);
                })
                .finally((response) => {
                    if(i === cntArray.totalPages && cnt === resJSON.length - 1) {
                        //RSS
                        if(plugins.rss) {
                            const xml = feed.xml({indent: true});
                            fs.writeFileSync(`${dir.dist.html}/rss.xml`, xml);
                        }
                    }
                });
        } catch (error) {
            console.error(error);
        }
    }
    done();
};
//新着情報なしのejsタスク
const newslessEjs = () => {
    const config = functions.getConfig(dir.config.config);
    const commonVar = functions.getConfig(dir.config.commonvar);
    const plugins = functions.getConfig(dir.config.plugins);
    const newsBlock = [];

    return src(
        `${dir.src.ejs}/**/*.ejs`,
        {
            ignore: [
                `${dir.src.ejs}/**/_*.ejs`,
                `${dir.plugins.ejs}/**`,
                `${dir.src.ejs}/news.ejs`,
                `${dir.src.ejs}/article.ejs`
            ] //_*.ejs(パーツ)とプラグインとindex,news,article(別タスクで定義)はhtmlにしない
        })
        .pipe(plumber({
            errorHandler: notify.onError({
                message: 'Error: <%= error.message %>',
                title: 'wpejs newslessEjs'
            })
        }))
        .pipe(data((file) => {
            return { 'filename': file.path }
        }))
        .pipe(ejs({ config, commonVar, plugins, newsBlock, parameters }))
        .pipe(rename({ extname: '.html' }))
        .pipe(htmlmin(jsConfig.configHtmlMin))
        .pipe(replace(jsConfig.htmlSpaceLineDel, ''))
        .pipe(gulp.dest(dir.dist.html));
};
//HTMLファイル生成されるまでの時間スリープを挟む
const sleep = async (done) => {
    let cnt = 0;
    const time = 0.3;
    const config = functions.getConfig(dir.config.config);
    const newsLength = config.param.news.newscount > config.param.news.indexcount ? config.param.news.newscount : config.param.news.indexcount;
    try {
        await axios.get(config.param.news.wpapi + '?per_page=' + newsLength)
            .then(function (response) {
                cnt = Number(response.headers['x-wp-total']);
                done();
            })
            .catch((error) => {
                throw new Error(error);
            });
    } catch (error) {
        console.error(error);
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(done());
        }, time * cnt);
    });
}

let ejsArray = [];
if(plugins.wordpress && (config.param.news.wpapi !== undefined && config.param.news.wpapi !== null && config.param.news.wpapi.length > 0)) {
    ejsArray = parallel(commonsEjs, indexEjs, newsEjs);
}
else {
    ejsArray = parallel(newslessEjs);
}
//上記をまとめておく
module.exports = series(ejsArray, sleep, imagemin);
