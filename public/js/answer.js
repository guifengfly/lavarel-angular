;(function(){
	'use strict';
	angular.module('answer',[])
    .directive('commentBlock', [
      '$http',
      'AnswerService',
      function ($http, AnswerService) {
        var o = {};
        o.templateUrl = 'comment.tpl';

        o.scope = {
          answer_id: '=answerId',
        }

        o.link = function (sco, ele, attr) {
          sco.Answer = AnswerService;
          sco._ = {};
          sco.data = {};
          sco.helper = helper;

          function get_comment_list() {
            return $http.post('/api/comment/read',
              {answer_id: sco.answer_id})
              .then(function (r) {
                if (r.data.status)
                  sco.data = angular.merge({}, sco.data, r.data.data);
              })
          }

          if (sco.answer_id)
            get_comment_list();
        	
          sco._.add_comment = function () {
            AnswerService.new_comment.answer_id = sco.answer_id;
            AnswerService.add_comment()
              .then(function (r) {
                if (r)
                {
                  AnswerService.new_comment = {};
                  get_comment_list();
                }
              })
          }
        }
        return o;
      }])	
	.service('AnswerService', [
		'$http', '$state',
		function($http,$state){
			var me = this;
			me.data={};
			me.answer_form={};
			/*统计票数
			*answers array用于统计票数
			*此数据可以是问题也可以是回答
			*如果是问题将会跳过统计
			*/
			me.count_vote=function(answers){
				/*迭代所有的数据*/
				for (var i = 0; i < answers.length; i++) {
					/*封装单个数据*/
					var votes,item =answers[i];
					/*如果不是回答也没有users元素，说明本条不是回答或回答没有任何条数*/
					if (!item['question_id']||!item['users']) {
						continue;
					}
					me.data[item.id]=item;
					if (!item['users']) {
						continue;
					}
					/*默认赞同票和反对票都为0*/
					item.upvote_count=0;
					item.downvote_count=0;
					/*users是所有投票用户的用户信息*/
					votes=item['users'];
					for (var j = 0; j < votes.length; j++) {
						var v =votes[j];
						/*获取pivot元素中的用户信息
						*如果是1将增加赞同票
						*如果是2强增加反对票
						*/
						if (v['pivot'].vote===1) {
							item.upvote_count++;
						}
						if (v['pivot'].vote===2) {
							item.downvote_count++;
						}				
					}
					
				}
				return answers;
			
			}
			me.add_or_update=function(question_id){
				if (!question_id) {
					console.error('question_id is required!');
					reurn;
				}
				me.answer_form.question_id=question_id;
				if (me.answer_form.id) {
					$http.post('/api/answer/change', me.answer_form)
		              .then(function (req) {
		                if (req.data.status) {
		                  me.answer_form = {};
		                  $state.reload();
		                  console.log('1');
		                }
		              })					
				}else{
					$http.post('/api/answer/add', me.answer_form)
		              .then(function (req) {
		                if (req.data.status) {
		                  me.answer_form = {};
		                  $state.reload();
		                  console.log('1');
		                }
		              })					
				}
			}
	        me.delete = function (id) {
	          if (!id) {
	            console.error('id is required');
	            return;
	          }

	          $http.post('/api/answer/remove', {id: id})
	            .then(function (r) {
	              if (r.data.status) {
	                console.log('deleted successfully!');
	                $state.reload();
	              }
	            })
	        }			
			me.vote=function(conf){
				if (!conf.id||!conf.vote) {
					console.log('id and vote required');
					return false;
				}
				var answer= me.data[conf.id],users=answer.users;
				if (answer.user_id == his.id) {
					console.log('you are voting yourself!');
					return false;
				}

				/*判断当前用户是否已经透过相同的票*/
				for(var i = 0;i<answer.users.length;i++){
					if (users[i].id==his.id&&conf.vote==users[i].pivot.vote) {
						conf.vote=3;
					}
				}
				return $http.post('api/answer/vote', conf)
				.then(function(req){
					if (req.data.status) {
						return true;
					}else if(req.data.msg=='login required!'){
						$state.go('login');
					}else{
						return false;
					}
				},function(err){
					return false;
				})

			}
			me.update_data=function(id){
				return $http.post('/api/answer/read', {id:id})
				.then(function(req){
					me.data[id]=req.data.data.data;
					console.log(me.data[id]);
				})
			}
			me.read=function(param){
				return $http.post('/api/answer/read', param)
				.then(function(req){
					if (req.data.status) {
						me.data=angular.merge({},me.data, req.data.data);
						return req.data.data;
					}
					return false;
					
				}, function(err){

				})
			}
			me.add_comment = function () {
				return $http.post('/api/comment/add', me.new_comment)
				.then(function (r) {
					console.log('r', r);
				if (r.data.status)
					return true;
				return false;
				})
			}			
	}])

})();

