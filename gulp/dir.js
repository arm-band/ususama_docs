//path difinition
module.exports = {
    assets: {
        jquery     : './node_modules/jquery/dist',
        easing     : './node_modules/jquery.easing',
        bootstrap  : './node_modules/bootstrap/dist/js',
        bowser     : './node_modules/bowser',
        lightbox   : './node_modules//luminous-lightbox/dist',
        swiper     : './node_modules/swiper',
        listjs     : './node_modules/list.js/dist'
    },
    src: {
        ejs        : './src/ejs',
        php        : './src/php',
        scss       : './src/scss',
        js         : './src/js',
        img        : './src/img',
        favicon    : './src/favicon',
        envfile    : './src/envfile',
        assets     : './src/assets'
    },
    config: {
        dir        : './bin/config',
        config     : '/config.yml',
        commonvar  : '/commonvar.yml',
        plugins    : '/plugins.yml',
        ftpconfig  : '/ftpconfig.yml',
        hachizetsu : '/subterranean/hachizetsu.yml',
        ftp        : '/subterranean/ftp.yml'
    },
    contents: {
        dir        : './src/contents'
    },
    plugins: {
        ejs        : './src/ejs/_plugins',
        scss       : './src/scss/_plugins',
        js         : './src/js/_plugins'
    },
    dist: {
        html       : './dist',
        news       : './dist/news',
        articles   : './dist/news/articles',
        css        : './dist/css',
        js         : './dist/js',
        img        : './dist/img',
        assets     : './dist/assets'
    },
    admin: {
        dir        : './bin/daishi',
        scss       : '/src/scss',
        js         : '/src/js',
        views      : '/views',
        css        : '/dist/public/css',
        distjs     : '/dist/public/js'
    }
};
