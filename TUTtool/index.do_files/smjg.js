define(function(require) {
    var template = require('text!./smjg.html');
    var page = {
        template : template,
        data : function() {
            return {
            	type: "",
            	msg:"",
            	dqsj:""
            };
        },
        created : function() {
        	this.initAction();
        },
        activated : function() {
        	this.initAction();
        },
        methods : {
        	getMsg: function(msgType){
        		var self = this;
        		switch (msgType) {
                case "1":
                	self.msg = "当前二维码已失效，请重新扫码！";
                    break;
                case "2":
                	self.msg = "账号为空或未登陆系统！";
                    break;
                case "3":
                	self.msg = "出馆成功！";
                    break;
                case "4":
                	self.msg = "您还不是本校职工或学生！";
                    break;
                case "5":
                	self.msg = "当前馆内人数已达最大值！";
                    break;
                case "6":
                	self.msg = "迟到，请重新预约！";
                    break;
                case "7":
                	self.msg = "超时被取消，请重新预约！";
                    break;
                case "8":
                	self.msg = "进馆成功！";
                    break;
                case "9":
                	self.msg = "当前时间点您没有预约信息，请确认！";
                    break;
                case "10":
                	self.msg = "距离扫码进馆时间未大于30秒，请等待！";
                    break;
                case "11":
                	self.msg = "未查询到进馆信息，请确认！";
                    break;
                case "12":
                	self.msg = "超时出馆！";
                    break;
        		}
            },
            initAction : function(){
            	var type = $.getParams('type');
            	var msgType = $.getParams('msgType');
            	var dqsj = $.getParams('dqsj');
            	this.getMsg(msgType);
            	this.type = type;
            	this.dqsj = dqsj;
            },
        }
    };
    return page;
});