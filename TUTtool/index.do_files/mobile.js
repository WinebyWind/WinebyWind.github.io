(function(require) {
    
    function getVersion(path) {
        return DEBUG ? path : path + '.min';
    }
    
    var requireConfig = {
        baseUrl : contextPath + '/sys',
        urlArgs : 'v=' + _v,
        paths: {
            vue: getVersion(resServer + '/bower_components/vue2/vue'),
            vueRouter: getVersion(resServer + '/bower_components/vue2/vue-router'),
            text: resServer + '/bower_components/text/text',
            MINT: resServer + '/fe_components/mobile/MINT/index',
            'emap-mobile': resServer + '/fe_components/mobile/emap-mobile.min',
            "emap-h5tag" : resServer + '/fe_components/mobile/tg-ui/emap-h5tag.min',
            BH_MOBILE: resServer + '/fe_components/mobile/BH_MIXIN_SDK',
            draggable: resServer + "/bower_components/vuedraggable/vuedraggable",
            sortable: resServer + "/bower_components/sortable/1.5.1/Sortable.min",
            appConfig : APPNAME + '/config'
        }
    };

    //默认的组件库和公共方法以及公共页面
    var defaultModules = ['vue', 'vueRouter', 'MINT', 'emap-mobile', 'emap-h5tag', 'draggable', 'appConfig'];
    
    // 自定义配置
    var customConfig = {};

    //封装的公共vue组件
    var commonComponents = {
        selectrole: 'mobilepub/modules/selectrole/selectrole',
        nodata: 'mobilepub/modules/nodata/nodata',
        home : 'mobilepub/modules/home/home',
        'approve-progress' : 'mobilepub/modules/approve-progress/approve-progress'
    };
    // 混入外部公共组件
    if(window.MOBILE_CONFIG) { 
        $.extend(true, customConfig, window.MOBILE_CONFIG); // 混入全局配置
    }

    /*
        用于保存所有模块的全局对象：
        routes：应用路由
        buttons: 应用按钮
        instance: Vue实例
     */
    window.APP_REGISTRY = {
        routes: [],
        buttons : [],
        instance : null,
        router : null
    };
    //配置require
    require.config(requireConfig);

    //加载框架所需的库和公共页面
    require(defaultModules, function(Vue, VueRouter, mintUI, EMAP_MOBILE, EMAP_H5TAG, draggable, appConfig) {
        Vue.component('draggable', draggable);
        //将各个组件库输出到全局作用域
        window.Vue = Vue;
        window.VueRouter = VueRouter;
        window.mintUI = mintUI;
        window.EMAP_MOBILE = EMAP_MOBILE;
        window.EMAP_H5TAG = EMAP_H5TAG;

        Vue.use(VueRouter);
        Vue.use(mintUI);
        EMAP_H5TAG.default.install(Vue);
        Vue.use(EMAP_MOBILE);
        $.extend(true,customConfig, appConfig); // 混入应用配置
        getAppConfig().then(initApp);
    });

    /**
     * 获取应用配置信息
     */
    function getAppConfig() {
        var dfd = $.Deferred();
        var configUrl = contextPath + '/sys/mobilepub/getAppConfig/' + APPNAME + '.do' + location.search;
        if(customConfig['SERVER_CONFIG_API']) {
            configUrl = customConfig['SERVER_CONFIG_API'];
        }
        mobileUtil.doPost(configUrl).done(function(result) {
            if(result && result.roleId) {
                window.GROUPID = result.roleId;
            } 
            if(customConfig['onLoadConfig']) {
                var ret = customConfig['onLoadConfig'](result);
                if(typeof ret['then'] === 'function') {
                    ret.then(dfd.resolve);
                }else {
                    dfd.resolve(ret);
                }
            }else {
                dfd.resolve(result);
            }
        }).fail(function(err){
            dfd.reject(err);
        });
        return dfd;
    }
    
    function setRoutesKeepAlive(routes) {
        for(var i=0;i<routes.length;i++) {
            var route = routes[i];
            if(!route.meta) {
                route.meta = {};
            }
            route.meta['keepAlive'] = true;
            if(route.children) {
                setRoutesKeepAlive(route.children);
            }
        }
    }
    
    /**
     * 初始化应用
     * @returns
     */
    function initApp(config) {
        // 初始化应用路由并返回首页模块名称
        var indexs = initVueRoute(config);
        var selectRole = config.selectRole;
        var routes = APP_REGISTRY.routes || [];
        // 注册公共过滤器
        var filters = customConfig['commonFilters'];
        if(filters) {
            for(var name in filters) {
                Vue.filter(name, filters[name]);
            }
        }
        // 注册公共组件和路由
        $.extend(commonComponents,customConfig['commonComponents']); // 混入自定义公共组件
        for(var name in commonComponents) {
            var component = $.loadComponent(commonComponents[name]);
            Vue.component(name, component);
            routes.push({
                name : name,
                path : '/' + name,
                component: component,
                props : true
            });
        }
        if(indexs.length > 1) {
            setRoutesKeepAlive(routes);
            var homeRoute = {
                 name : '/',
                 path : '/',
                 component : $.loadComponent(commonComponents['home']),
                 children : routes,
                 meta : {
                     keepAlive : true
                 },
                 props : true
            };
            routes = [homeRoute];
        } else if(indexs.length == 1) {
            indexs[0].alias = '/';
        }
        var router = APP_REGISTRY.router;
        if(router == null) {
            APP_REGISTRY.router = router = new VueRouter({
                routes: routes,
                scrollBehavior : function(to,from,savedPosition) {
                    return savedPosition ? savedPosition : {x: 0, y: 0};
                }
            });
        }else {
            // 添加新增的路由
            router.addRoutes(routes);
        }
        router.beforeEach(function(to,from,next) {
            if(to.matched.length == 0 && from.path != to.path && from.name != 'selectrole') {
                from.name ? next({name : from.name}) : next('/');
            }else {
                next();
            }
        });
        router.afterEach(function(to, from, next) {
            mintUI.MessageBox.close();
        });
        getWechatSign().then(function() {
            initAppVue(router, selectRole, indexs);
        });
    }
    
    function initAppVue(router, selectRole, indexs) {
        var app = APP_REGISTRY.instance;
        if(app == null) {
            APP_REGISTRY.instance = app = new Vue({
                el: '#app',
                router: router
            });
        }
        if(selectRole) {
            router.replace('selectrole');
            return;
        }
        if(!indexs.length) {
            $.msg('配置错误,未获取入口模块', 'fail');
            return;
        }
        var name = '';
        if(location.hash) {
            if(location.hash.charAt(0) == '#') {
                name = location.hash.substr(1);
            }
            if(name == '/selectrole') {
                name = '';
            }
        }
        name = name || indexs[0].name;
        if(indexs.length > 1) {
            router.replace({name : '/', params: {
                tabs : indexs,
                selected : name
            }});
        }else {
            router.replace(name);
        }
    }
    
    /**
     * 获取微信签名
     * @returns
     */
    function getWechatSign() {
        var dfd = $.Deferred();
        if(!window.BH_MOBILE) {
            require(['BH_MOBILE'], function(BH_MOBILE) {
                window.BH_MOBILE = BH_MOBILE;
                //如果在微信环境，则请求微信签名用于加载微信jssdk
                if (/micromessenger/.test(navigator.userAgent.toLowerCase())) {
                    sign().then(function(config) {
                        BH_MOBILE.default(function(res) {
                            window.SDK = res.sdk;
                            dfd.resolve();
                        }, config);
                    });
                } else {
                    //不在微信环境直接返回 
                    BH_MOBILE.default(function(res) {
                        window.SDK = res.sdk;
                        dfd.resolve();
                    });
                }
            });
        }else {
            dfd.resolve();
        }
        return dfd;
    }
    
    function sign() {
        var dfd = $.Deferred();
        mobileUtil.doPost(contextPath + '/sys/mobilepub/getWechatSign.do', {
            url: window.location.href.replace(/#(\S+)?/, '')
        }).done(function(result) {
            var config = {
                wx: {
                    uploadImgsToEmapUrl: contextPath + '/sys/mobilepub/saveFileFromWechat.do',
                    signData : result
                },
                dd: {}
            };
            dfd.resolve(config);
        });
        return dfd;
    }
    
    /**
     * 初始化路由,返回首页路由信息
     * @returns
     */
    function initVueRoute(config) {
        $.extend(APP_REGISTRY, config);
        var indexs = [];
        APP_REGISTRY.routes.forEach(function(route, index) {
            registerRoute(route);
            if(route.index) {
                indexs.push(route);
            }
        });
        return indexs;
    }
    
    /**
     * 注册路由
     * @param route
     * @returns
     */
    function registerRoute(route) {
        var tmps = route.name.split('/');
        var path = route.name + '/' + tmps[tmps.length - 1];
        route.component = $.loadComponent(APPNAME + '/modules/' + path);
        if(route.children) {
            route.children.forEach(function(child) {
                registerRoute(child);
            });
        }
    }
    
    /**
     * 编译模板
     * @param tpl
     * @returns
     */
    function compileTpl(tpl) {
        var authBtns = APP_REGISTRY.buttons;
        if (authBtns.length < 1 || !tpl) {
            return tpl;
        }
        var $html = $(tpl);
        $html.find('[manageAuth="Y"]').each(function(){
            var $btn = $(this);
            var id = $btn.attr("id");
            if($.inArray(id,authBtns) < 0) { // 不存在则移除
                $btn.remove();
            }
        });
        return $html.prop('outerHTML');
    }
}(require));