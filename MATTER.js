
/**
* create a new matter
* @param{String} name, name of the matter
* @param{[String]} description, optional description of the matter
* @return{String} matterId, unique id of the matter
**/
function createMatter_(name, description) {
  var token = ScriptApp.getOAuthToken();
  var url = "https://vault.googleapis.com/v1/matters";
  var headers = {"Authorization": 'Bearer ' +token};
  
  var payload = {"name":name};
  if(description){
    payload.description = description; 
  }
  var params = {
    "method":"POST",
    'contentType': 'application/json',
    "payload":JSON.stringify(payload),
    "headers":headers
  };
  
  var result = UrlFetchApp.fetch(url, params);
  var ret = JSON.parse(result.getContentText());
  return ret.matterId;
}

/**
* add a collaborator to a given matter from it's ID
* @param{String} matterId, unique id of the matter to modify
* @param{String} collaboratorEmail, email of the user to add to the matter
* @param{[String]} role, autorisation level granted to the user. Default autorisation is "COLLABORATOR". Other value is "OWNER"
* @param{[Boolean]} userNotification, notify the collaborator by email
* @return{Object} collaboratorInfo, {email, userId, role}
**/
function addMatterCollaborator_(matterId, collaboratorEmail, roleRaw, userNotification){
  roleRaw = roleRaw || "COLLABORATOR";
  var role = roleRaw.toUpperCase();
  var roles = ["COLLABORATOR","OWNER"];
  if(roles.indexOf(role) == -1){
    throw "Can't add collaborator to matter, role "+roleRaw+" unhandled"; 
  }
  var token = ScriptApp.getOAuthToken();
  var url = "https://vault.googleapis.com/v1/matters/"+matterId+":addPermissions";
  var headers = {"Authorization": 'Bearer ' +token};
  var accountId = AdminDirectory.Users.get(collaboratorEmail).id;
  
  var payload = {
    "matterPermission": {
      "accountId": accountId,
      "role": role
    }
  };

  if(userNotification != undefined){
    payload.sendEmails = userNotification;
  }
  
  var params = {
    "method":"POST",
    'contentType': 'application/json',
    "payload":JSON.stringify(payload),
    "headers":headers
  };
  
  var result = UrlFetchApp.fetch(url, params);
  if(result.getResponseCode() < 300){
    return {email:collaboratorEmail, userId:accountId, role:role};
  }
  console.warn(result.getResponseCode()+" - "+result.getContentText());
  throw result.getContentText();
}


/**
* remove a collaborator to a given matter from it's ID
* @param{String} matterId, unique id of the matter to modify
* @param{String} collaboratorEmail, email of the user to add to the matter
* @return{Object} undefined, there is no return in case of success
**/
function removeMatterCollaborator_(matterId, collaboratorEmail){
  var token = ScriptApp.getOAuthToken();
  var url = "https://vault.googleapis.com/v1/matters/"+matterId+":removePermissions";
  var headers = {"Authorization": 'Bearer ' +token};
  var accountId = AdminDirectory.Users.get(collaboratorEmail).id;
  
  var payload = {
    "accountId": accountId
  };

  var params = {
    "method":"POST",
    'contentType': 'application/json',
    "payload":JSON.stringify(payload),
    "headers":headers
  };
  
  var result = UrlFetchApp.fetch(url, params);
  if(result.getResponseCode() < 300){
    return;
  }
  console.warn(result.getResponseCode()+" - "+result.getContentText());
  throw result.getContentText();
}

/**
* update matter (name / description)
* @param{String} matterId, unique id of the matter to modify
* @param{Object} fields, fields to update {"name":String, "description":String};
* @return{Object} undefined, there is no return in case of success
**/
function updateMatter_(matterId, fields){
  var token = ScriptApp.getOAuthToken();
  var url = "https://vault.googleapis.com/v1/matters/"+matterId;
  var headers = {"Authorization": 'Bearer ' +token};
  
  var payload = fields;

  var params = {
    "method":"PUT",
    'contentType': 'application/json',
    "payload":JSON.stringify(payload),
    "headers":headers
  };
  
  var result = UrlFetchApp.fetch(url, params);
  if(result.getResponseCode() < 300){
    return JSON.parse(result.getContentText());
  }
  console.warn(result.getResponseCode()+" - "+result.getContentText());
  throw result.getContentText();
}


/**
* close a matter when achieved
* @param{String} matterId
* @return{Number} responseCode, 200 if successfull
**/
function closeMatter_(matterId){
  var url = "https://vault.googleapis.com/v1/matters/"+matterId+":close"; 
  var token = ScriptApp.getOAuthToken();
  var headers = {"Authorization": 'Bearer ' +token};
  
  var params = {
    "method":"POST",
    'contentType': 'application/json',
    "headers":headers
  };
  var result = UrlFetchApp.fetch(url, params);
  return result.getResponseCode();
}

/**
* retrive all the matters available for a given user
* @param{String} state, state of the matter 
* @return {Array} Matters
**/
function getMatters_(stateRaw){
  var states = ["OPEN","CLOSED", "DELETED"];
  var state;
  if(stateRaw !== undefined){
    state = stateRaw.toUpperCase();
    if(states.indexOf(state) == -1){
      throw "Matter state not recognized: "+stateRaw; 
    }
  }
  
  var baseUrl = "https://vault.googleapis.com/v1/matters";
  
  var token = ScriptApp.getOAuthToken();
  var headers = {"Authorization": 'Bearer ' +token};
  var decorator = "";
  if(state !== undefined){
    decorator = "?state="+state;
  }
  var pageToken;
  
  var matters = [];
  
  function juiceResponseMatters(matterRaw){
    var matter = new Matter();
    matter.setStatus(matterRaw);
    this.push(matter);
  }
  
  do{
    var params = {
      "method":"GET",
      'contentType': 'application/json',
      "headers":headers
    };  
    var result = UrlFetchApp.fetch(baseUrl+decorator, params);
    
    var response = JSON.parse(result.getContentText());
    
    if(response.matters){
      response.matters.forEach(juiceResponseMatters, matters);
    }
    
    pageToken = response.nextPageToken;
    if(state !== undefined){
      decorator = "?state="+state+"&pageToken="+pageToken;
    }
    else{
      decorator = "?pageToken="+pageToken;
    }
    
  }
  while(pageToken !== undefined);
  return matters;  
}

/**
* retrieve matter detail from it's ID
* @param{String} matterId
* @return{Object} raw matter object
**/
function getMatterById_(matterId){
  var url = `https://vault.googleapis.com/v1/matters/${matterId}?view=FULL`;
  var token = ScriptApp.getOAuthToken();
  var headers = {"Authorization": 'Bearer ' +token};
  
  var params = {
    "method":"GET",
    'contentType': 'application/json',
    "headers":headers
  };
  var result = UrlFetchApp.fetch(url, params);
  var out = JSON.parse(result.getContentText());
  return out;
}



/**
* retrieve a bucketFile and save it in Google Drive
* @param{String} BUCKET_NAME
* @param{String} OBJECT_NAME
* @return{Object} file, Google drive file object
**/
function saveToDriveBucketFile_(BUCKET_NAME,OBJECT_NAME){
  var name = OBJECT_NAME.split('/').pop();
  var url = "https://www.googleapis.com/storage/v1/b/"+encodeURIComponent(BUCKET_NAME)+"/o/"+encodeURIComponent(OBJECT_NAME)+"?alt=media";
  var token = ScriptApp.getOAuthToken();
  var headers = {"Authorization": 'Bearer ' +token};
  
  var params = {
    "method":"GET",
    'contentType': 'application/json',
    "headers":headers,
    muteHttpExceptions:true
  };
  var result = UrlFetchApp.fetch(url, params);
  var file = DriveApp.createFile(name, result.getContentText());
  return file;
}
