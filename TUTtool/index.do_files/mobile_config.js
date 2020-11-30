window.MOBILE_CONFIG = {
    commonComponents: {
        'hr-search-person': 'rsmobile/modules/hr-search-person/hr-search-person',
        //下载附件列表
        'hr-attachment': 'rsmobile/modules/hr-attachment/hr-attachment',
        //时间范围组件
        'hr-date-range': 'rsmobile/modules/hr-date-range/hr-date-range',
        //下拉选择时间组件
        'hr-date-menu': 'rsmobile/modules/hr-date-menu/hr-date-menu',
        //下拉搜索组件
        'hr-select-search': 'rsmobile/modules/hr-select-search/hr-select-search',
        //没有更多了
        'hr-nomore-data': 'rsmobile/modules/hr-nomore-data/hr-nomore-data',
        //人事只读表单
        'hr-readonly-form': 'rsmobile/modules/hr-readonly-form/hr-readonly-form'
    },
    commonFilters: {
        //空数据处理
        'nvl': function(value, defaultMsg) {
            if (value) {
                return value;
            }
            return defaultMsg ? defaultMsg : '暂无数据';
        },
        // 返回最后一级单位
        'lastDw': function(value, split) {
            if (!value) {
                return '';
            }
            split = split || '/';
            var tmps = value.split('/');
            return tmps[tmps.length - 1];
        }
    }
};
window._EMAPMFORM_unblind = {
    unblind: '/'
};
