<?php

namespace OCA\Chat\OCH\Commands;

use \OCA\Chat\OCH\ChatAPI;
use \OCA\Chat\Core\API;
use \OCA\Chat\OCH\Db\UserOnline;
use \OCA\Chat\OCH\Db\UserOnlineMapper;
use \OCA\Chat\OCH\Db\User;
use \OCA\Chat\OCH\Db\UserMapper;
use \OCA\Chat\OCH\Db\Conversation;
use \OCA\Chat\OCH\Db\ConversationMapper;
use \OCA\Chat\OCH\Db\PushMessage;
use \OCA\Chat\OCH\Db\PushMessageMapper;

class Join extends ChatAPI {
	
	public function __construct(API $api){
		parent::__construct($api);
	}

	public function setRequestData(array $requestData){
		$this->requestData = $requestData;
	}		
	
	public function execute(){
   		$userMapper = new UserMapper($this->api);
   		$users = $userMapper->findByConversation($this->requestData['conv_id']);
   		
   		if (count($users) === 0){
   			$conversation = new Conversation();
   			$conversation->setConversationId($this->requestData['conv_id']);
   			$mapper = new ConversationMapper($this->api); 
   			$mapper->insert($conversation);
   			 
   			$user = new User();
   			$user->setConversationId($this->requestData['conv_id']);
   			$user->setUser($this->requestData['user']['backends']['och']['value']);
			$user->setSessionId($this->requestData['session_id']);
   			$userMapper = new UserMapper($this->api);
   			$userMapper->insert($user);
   			
   			return true;
   		} else { 
   			$user = new User();
   			$user->setConversationId($this->requestData['conv_id']);
   			$user->setUser($this->requestData['user']['backends']['och']['value']);
			$user->setSessionId($this->requestData['session_id']);
   			$userMapper = new UserMapper($this->api);
   			$userMapper->insert($user);
			
   			if (count($users) == 2){
	   			// Send a push message to all users in this conversation to inform about a new user which joined
	   			$command = json_encode(array(
	   				"type" => 'joined',
	   				"data" => array(
	   					"user" => $this->requestData['user'],
	   					"timestamp" => $this->requestData['timestamp'],
	   					"conv_id" => $this->requestData['conv_id']
   					)
				));
	   			
	   			$sender = $this->requestData['user']; // copy the params('user') to a variable so it won't be called many times in a large conversation
	   			$PushMessageMapper = new PushMessageMapper($this->api);
	   			foreach($users as $receiver){
	   				if($receiver->getUser() !== $sender){
	   					$pushMessage = new PushMessage();
	   					$pushMessage->setSender($sender);
	   					$pushMessage->setReceiver($receiver->getUser());
	   					$pushMessage->setReceiverSessionId($receiver->getSessionId());
	   					$pushMessage->setCommand($command);
	   					$PushMessageMapper->insert($pushMessage);
	   				}
	   			}
   			}
   			
   			return true;
   		} 
	}	

}
