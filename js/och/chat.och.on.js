Chat.och.on = {
    newConv : function(userToInvite, success){
        var newConvId = Chat.och.util.generateConvId();
        Chat.och.api.command.join(newConvId, function(){
            Chat.och.api.command.invite(
                userToInvite,
                newConvId,
                success(newConvId, [userToInvite]),
                function(errorMsg){
                    if(errorMsg === 'USER-TO-INVITE-NOT-ONLINE'){
                        Chat.app.view.alert('The user you tried to invite isn\'t online, you already can send messages');// TODO
                    } else if(errorMsg === 'USER-TO-INVITE-NOT-OC-USER'){
                        Chat.app.view.alert('The user you tried to invite isn\'t a valid owncloud user')
                        // Leave the already joined conversation
                        Chat.och.api.command.leave(newConvId, function(){});
                    } else {
                        Chat.app.view.alert(errorMsg);
                    }
                }
            );
        });  
    },
    sendChatMsg : function(convId, msg){
        Chat.och.api.command.sendChatMsg(msg, convId, function(){});
    },
    invite : function(convId, userToInvite){
        console.log('Chat.och.on.invite called');
        Chat.och.api.command.invite(
            userToInvite,
            convId,
            function(){ // Success
            
            },
            function(errorMsg){ // Error
                if(errorMsg === 'USER-TO-INVITE-NOT-ONLINE'){
                    Chat.app.view.alert('The user you tried to invite isn\'t online, you already can send messages');// TODO
                } else if(errorMsg === 'USER-TO-INVITE-NOT-OC-USER'){
                    Chat.app.view.alert('The user you tried to invite isn\'t a valid owncloud user')
                }
            }
     );
    },
    leave : function(convId, success){
    	Chat.och.api.command.leave(convId, success);
    },
    applyAvatar : function(element, user, size){
        element.avatar(user, size);
    }
};