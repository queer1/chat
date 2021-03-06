 util : {
    	generateSessionId : function(){
            var timestamp = "sessionID" + (new Date).getTime();
            var sessionID = md5(timestamp);
            return sessionID.toString();
    	},
    	generateConvId : function(){
            var timestamp = "conversation" + (new Date).getTime();
            var conversationID = md5(timestamp);
            return conversationID.toString();
    	},
    	timeStampToDate : function(timestamp){
            var date = new Date(timestamp*1000);
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            return	{hours : date.getHours(), minutes : date.getMinutes(), seconds : date.getSeconds()};
    	},
    	countObjects : function(object){
            var count = 0;
            for (var k in object) {
                if (object.hasOwnProperty(k)) {
                   ++count;
                }
            }
            return count;
    	},
    	checkMobile : function(){
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    	},
    	quit : function(){
            $.ajax({
                type: "POST",
                url: OC.Router.generate("chat_och_api"),
                data: {"JSON" : JSON.stringify({ "type" : "command::quit::request", "data" : { "user" : OC.currentUser, "session_id" : Chat.sessionId, "timestamp" : (new Date).getTime() / 1000}})},
                async: false,
            });
    	},
        init : function(){
            Chat.sessionId = Chat.util.generateSessionId();
            Chat.api.command.greet(function(){
                //TODO add getConversation function
                Chat.api.util.longPoll();
            });
        },
        updateOnlineStatus : function(){
        	Chat.api.command.online();
        },
        titleHandler : function(){
        	Chat.ui.clearTitle();
    		setTimeout(function(){
    			Chat.ui.updateTitle();
    		}, 1000);
        }

    },
    api : {
    	command : {
            greet : function(success){
                Chat.api.util.doRequest({"type" : "command::greet::request", "data" : { "user" : OC.currentUser, "session_id" : Chat.sessionId, "timestamp" : (new Date).getTime() / 1000 }}, success);
            },
            join : function(convId, success){
                Chat.api.util.doRequest({"type" : "command::join::request", "data" : { "conv_id": convId,  "timestamp" : (new Date).getTime() / 1000, "user" : OC.currentUser, "session_id" : Chat.sessionId }}, success);
            },
            invite : function(userToInvite, convId, success, error){
                Chat.api.util.doRequest({"type" : "command::invite::request", "data" : { "conv_id" : convId, "timestamp" : (new Date).getTime() / 1000, "user_to_invite" : userToInvite , "user" : OC.currentUser, "session_id" : Chat.sessionId }},success,error);
            },
            sendChatMsg : function(msg, convId, success){
                Chat.api.util.doRequest({"type" : "command::send_chat_msg::request", "data" : {"conv_id" : convId, "chat_msg" : msg, "user" : OC.currentUser, "session_id" : Chat.sessionId, "timestamp" : (new Date).getTime() / 1000  }}, success);
            },
            leave : function(convId, success){
                Chat.api.util.doRequest({"type" : "command::leave::request", "data" : { "conv_id" : convId, "user" : OC.currentUser, "session_id" : Chat.sessionId, "timestamp" : (new Date).getTime() / 1000  }}, success);
            },
            online : function(success){
            	Chat.api.util.doRequest({"type" : "command::online::request", "data" : { "user" : OC.currentUser, "session_id" : Chat.sessionId, "timestamp" : (new Date).getTime() / 1000}}, function(){});
            }
    	},
    	on : {
            invite : function(data){
                Chat.scope.$apply(function(){
                    Chat.scope.view.addConv(data.conv_id, data.user);
                }); 
                Chat.api.command.join(data.conv_id, function(){});
                Chat.ui.alert('You auto started a new conversation with ' + data.user);
            },
            chatMessage : function(data){
                Chat.scope.$apply(function(){
                    Chat.scope.view.addChatMsg(data.conv_id, data.user, data.chat_msg, data.timestamp);	
                });
            },
            joined : function(data){
            	Chat.ui.alert('The user ' + data.user + ' joined this conversation');
            	Chat.scope.$apply(function(){
            		Chat.scope.view.addConv(data.conv_id. data.user);
                });
            }
    	},
    	util : {
            doRequest : function(request, success, error){
                $.post(OC.Router.generate("chat_och_api"), {JSON: JSON.stringify(request)}).done(function(response){
                	if(response.data.status === "success"){
                        success();
                    } else if (response.data.status === "error"){
                    	error(response.data.data.msg);
                    }
                });
            },
            longPoll : function(){
                this.getPushMessages(function(push_msgs){
                    var ids_del = [];
                    $.each(push_msgs.push_msgs, function(push_id, push_msg){
                        ids_del.push(push_id);
                        Chat.api.util.handlePushMessage(push_msg);
                    });
                    Chat.api.util.deletePushMessages(ids_del, function(){
                        Chat.api.util.longPoll();
                    });
                });
            },
            handlePushMessage : function(push_msg){
        		if (push_msg.type === "invite"){
        			Chat.api.on.invite(push_msg.data);
                } else if (push_msg.type === "send_chat_msg"){
                    Chat.api.on.chatMessage(push_msg.data);
                } else if (push_msg.type === "joined"){
                    Chat.api.on.joined(push_msg.data);
                } /*else if (msg.data.type === "left"){
                        var conversationID = msg.data.param.conversationID;
                        getUsers(server, conversationID, function(msg){
                                if (msg.data.param.users.length <= 1){
                                        deleteConversation(conversationID);
                                }
                        }); 
                }*/
            },
            getPushMessages : function(success){
                $.post(OC.Router.generate('chat_och_api'), {"JSON" : JSON.stringify({"type" : "push::get::request", "data" : { "user" : OC.currentUser, "session_id" : Chat.sessionId}})}, function(data){
                    success(data);
                });
            },
            deletePushMessages : function(ids, success){
                $.post(OC.Router.generate('chat_och_api'), {"JSON" : JSON.stringify({"type" : "push::delete::request", "data" : {"user" : OC.currentUser, "session_id" : Chat.sessionId, ids: ids}})}, function(data){
                   success();
                });
            },
    	}
    },