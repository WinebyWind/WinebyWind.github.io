;(function(window) {
    /**
     * Ajax全局设置，发送前后添加进度控件
     */
    var ajaxSettings = {
        beforeSend: function(xhr) {
            mintUI.Indicator.open();
            return true;
        },
        complete: function(xhr) {
            Vue.nextTick(function() {
                mintUI.Indicator.close();
            });
        },
        error: function(xhr, sts, err) {
            mintUI.MessageBox('提示', "系统异常，请联系管理员");
            console.log("请求异常:" + err);
        }
    };
    /**
     * 发送异步请求
     */
    function doAjax(url, opts) {
        var dfd = $.Deferred();
        opts = $.extend({},ajaxSettings,{
            success: function(resp) {
                if (resp.code == 0) {
                    dfd.resolve(resp.datas);
                } else {
                    mintUI.MessageBox('提示', resp.msg);
                    dfd.reject(resp.msg);
                }
            }
        }, opts);
        $.ajax(url, opts);
        return dfd.promise();
    }
    /**
     * 发送同步请求
     */
    function doSyncAjax(url, params, method, opts) {
        var resp = $.ajax($.extend({},ajaxSettings,{
            type: method || 'POST',
            url: url,
            traditional: true,
            data: params || {},
            dataType: 'json',
            cache: false,
            async: false
        }, opts));
        if (resp.status != 200) {
            mintUI.MessageBox('提示', "请求返回异常");
            console.error("请求返回异常，请检查network：" + resp.status);
            return {};
        }
        var result;
        try {
            result = JSON.parse(resp.responseText);
        } catch (e) {
            mintUI.MessageBox('提示', "数据格式有误");
            console.error("数据格式有误，后台返回的数据无法转换为JSON格式：“" + resp.responseText + "”");
            throw e;
        }
        if (typeof result.loginURL != 'undefined' && resp.loginURL != '') {
            window.location.href = result.loginURL;
        }
        return result;
    }
    function convertModel(model, type) {
        if (model === undefined || model == null) {
            return undefined;
        } else {
            if (type === undefined)
                return model.controls;
            else {
                if (model instanceof Array) {
                    addGetMethod(model);
                    return model;
                } else {
                    addGetMethod(model.controls);
                    return type == "search" ? model : model.controls;
                }
            }
        }
        function addGetMethod(controls) {
            controls.map(function(item) {
                item.get = function(field) {
                    if (this[type + "." + field] !== undefined && this[type + "." + field] !== "")
                        return this[type + "." + field];
                    else
                        return this[field];
                };
            });
        }
    }
    function getRequestPath(path) {
        if(path.indexOf('://') > 0) {
            return path;
        }
        if(path.charAt(0) != '/') {
            path = '/' + path;
        }
        return basePath + path;
    }
    /**
     * 获取模型
     */
    function getModel(pagePath, actionID, type, params, requestOption) {
        if (typeof(pagePath) === 'object') {
            return convertModel(pagePath, type);
        }
        var model;
        if (type == "search") {
            pageMeta = doSyncAjax(getRequestPath(pagePath.replace('.do', '/' + actionID + '.do')), $.extend({
                "*searchMeta": "1"
            }, params), null, requestOption);
            model = pageMeta.searchMeta;
        } else {
            var pageMeta = doSyncAjax(getRequestPath(pagePath), $.extend({
                "*json" : "1"
            }, params), null, requestOption);
            var getData = pageMeta.models.filter(function(val) {
                return val.name == actionID;
            });
            model = getData[0];
        }
        return convertModel(model, type);
    }
    
    /**
     * 工具类实例
     */
    var mobileUtil = {
        doGet: function(url, params, opts) {
            opts = $.extend({
                type: 'GET',
                data: params
            }, opts);
            return doAjax(url, opts);
        },
        doPost: function(url, params, opts) {
            opts = $.extend({
                type: 'POST',
                data: params
            }, opts);
            return doAjax(url, opts);
        },
        getModel: getModel,
        /**
         * 异步加载组件
         */
        loadComponent: function(path) {
            return function() {
                var dfd = $.Deferred();
                require([path], function(data) {
                    dfd.resolve(data);
                });
                return dfd.promise();
            };
        },
        toast: function(opts) {
            return mintUI.Toast(opts);
        },
        alert: function(msg, fn, opts) {
            var dfd = $.Deferred();
            mintUI.MessageBox.alert(msg,'提示',opts).then(function(action) {
                if (fn) {
                    fn(action);
                }
                dfd.resolve(action);
            });
            return dfd.promise();
        },
        confirm: function(msg, yes, no, opts) {
            var dfd = $.Deferred();
            mintUI.MessageBox.confirm(msg, '确认', opts).then(function(val) {
                if (yes) {
                    yes(val);
                }
                dfd.resolve(val);
            }, function(val) {
                if (no) {
                    no(val);
                }
                dfd.reject(val);
            }).catch(dfd.reject);
            return dfd.promise();
        },
        prompt: function(msg, fn, opts) {
            var dfd = $.Deferred();
            mintUI.MessageBox.prompt(msg, '提示', opts).then(function(val) {
                if (fn) {
                    fn(val);
                }
                dfd.resolve(val);
            }, function(val) {
                if (fn) {
                    fn(val);
                }
                dfd.reject(val);
            }).catch(dfd.reject);
            return dfd.promise();
        },
        msg: function(msg, type, opts) {
            type = type || 'success';
            var className = type == 'success' ? 'iconfont icon-wancheng' : type == 'fail' ? 'iconfont icon-weiwancheng' : '';
            return mobileUtil.toast($.extend({
                message: msg || '',
                iconClass: className
            }, opts));
        },
        err : function(msg, opts) {
            return mobileUtil.alert(msg,null, opts);
        },
        showLoading: function(text, opts) {
            mintUI.Indicator.open($.extend({
                text: text || '',
                spinnerType: 'fading-circle'
            }, opts));
        },
        hideLoading: function() {
            mintUI.Indicator.close();
        },
        toJsonStr: function(obj) {
            return JSON.stringify(obj);
        },
        toJson: function(str) {
            return JSON.parse(str);
        },
        push: function(loc, params) {
            var route = $.resolveRoute(loc).route;
            if (route.name) {
                $.getRouter().push({
                    path: route.path,
                    query: params
                });
            } else {
                $.getRouter().push({
                    path: loc,
                    query: params
                });
            }
        },
        replace: function(loc, params) {
            var route = $.resolveRoute(loc).route;
            if (route.name) {
                $.getRouter().replace({
                    path: route.path,
                    query: params
                });
            } else {
                $.getRouter().replace({
                    path: loc,
                    query: params
                });
            }
        },
        go: function(n) {
            $.getRouter().go(n);
        },
        back : function() {
            $.getRouter().back();
        },
        getRouter: function() {
            return APP_REGISTRY.instance.$router;
        },
        resolveRoute: function(location) {
            return $.getRouter().resolve(location);
        },
        getParams : function(key) {
            var params = APP_REGISTRY.instance.$route.query;
            if(!key) {
                return params;
            }
            return params[key];
        }
    };
    // 移动SDK集成方法
    ["setTitleText", "closeWebView", "takeCamera", "takePhoto", "previewImages", "scan", "uploadImgsToEmap"].forEach(function(method) {
        mobileUtil[method] = function() {
            return SDK[method].apply(SDK,arguments);
        };
    });
    window['mobileUtil'] = mobileUtil;
    window['APP_CONFIG'] = $.extend({
        SENTRY_CONFIG_URI : contextPath + '/sys/mobilepub/res/sentry/' + APPNAME + '.do'
    },window['MOBILE_CONFIG']);
    $.extend(mobileUtil);
})(window);
