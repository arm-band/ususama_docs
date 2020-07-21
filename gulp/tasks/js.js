const _         = require('../plugin');
const dir       = require('../dir');
const functions = require('../functions');
const plugins = functions.getConfig(dir.config.plugins);

//js圧縮&結合&リネーム
const jsConcat = () => {
    let libSrcArray = [`${dir.assets.jquery}/jquery.min.js`, `${dir.assets.bootstrap}/bootstrap.bundle.min.js`, `${dir.assets.easing}/jquery.easing.js`];
    if(plugins.lightbox) {
        libSrcArray.push(`${dir.assets.lightbox}/js/lightbox.min.js`);
    }
    if(plugins.slick) {
        libSrcArray.push(`${dir.assets.slick}/slick.js`);
    }
    if(plugins.sitesearch) {
        libSrcArray.push(`${dir.assets.listjs}/list.min.js`);
    }
    libSrcArray.push(`${dir.src.js}/_plugins/_plugins.js`);

    return _.gulp.src(libSrcArray)
        .pipe(_.plumber())
        .pipe(_.concat('lib.js'))
        .pipe(_.gulp.dest(`${dir.src.js}/concat/`)); //srcとdistを別ディレクトリにしないと、自動でタスクが走る度にconcatしたものも雪だるま式に追加されていく
};
const jsLibBuild = () => {
    return _.gulp.src([`${dir.src.js}/concat/**/*.js`])
        .pipe(_.plumber())
        .pipe(_.uglify({
            output: {
                comments: 'all'
            }
        }))
        .pipe(_.rename((path) => {
            path.basename += '.min'
            path.extname = '.js'
        }))
        .pipe(_.gulp.dest(dir.dist.js));
};
const jsBuild = () => {
    let objGulp = _.gulp.src([`${dir.src.js}/**/*.js`, `!${dir.src.js}/concat/**/*.js`, `!${dir.src.js}/_plugins/**/*.js`]);
    if(process.env.DEV_MODE === 'true') {
        objGulp = objGulp.pipe(_.sourcemaps.init())
    }
    objGulp = objGulp.pipe(_.plumber())
        .pipe(_.uglify({
            output: {
                comments: 'some'
            }
        }))
        .pipe(_.rename((path) => {
            path.basename += '.min'
            path.extname = '.js'
        }));
    if(process.env.DEV_MODE === 'true') {
        objGulp = objGulp.pipe(_.sourcemaps.write())
    }
    objGulp = objGulp.pipe(_.gulp.dest(dir.dist.js));
    return objGulp;
};

module.exports = _.gulp.series(jsConcat, jsLibBuild, jsBuild);
