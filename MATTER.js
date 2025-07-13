
/**
* create a new matter
* @param{String} name, name of the matter
* @param{[String]} description, optional description of the matter
* @return{String} matterId, unique id of the matter
**/
function createMatter_(name, description) {
  const url = "https://vault.googleapis.com/v1/matters"; 
  var payload = {"name":name};
  if(description){
    payload.description = description; 
  }
  
  const result = new APICall().url(url).method("POST").payload(payload).execute();
  return result.matterId;
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
  const role = roleRaw.toUpperCase();
  const roles = ["COLLABORATOR","OWNER"];
  if(roles.indexOf(role) == -1){
    throw new Error("Can't add collaborator to matter, role "+roleRaw+" unhandled"); 
  }
  const url = `https://vault.googleapis.com/v1/matters/${matterId}:addPermissions`;
  const accountId = AdminDirectory.Users.get(collaboratorEmail).id;
  
  var payload = {
    "matterPermission": {
      "accountId": accountId,
      "role": role
    }
  };

  if(userNotification != undefined){
    payload.sendEmails = userNotification;
  }
  
  var result = new APICall().url(url).method("POST").payload(payload).execute();
  return {"email":collaboratorEmail, "userId":accountId, "role":role};
}


/**
* remove a collaborator to a given matter from it's ID
* @param{String} matterId, unique id of the matter to modify
* @param{String} collaboratorEmail, email of the user to add to the matter
* @return{Object} undefined, there is no return in case of success
**/
function removeMatterCollaborator_(matterId, collaboratorEmail){
  const url = `https://vault.googleapis.com/v1/matters/${matterId}:removePermissions`;
  const accountId = AdminDirectory.Users.get(collaboratorEmail).id;
  
  var payload = {
    "accountId": accountId
  };
  
  const result = new APICall().url(url).method("POST").payload(payload).execute();
  return;
}

/**
* update matter (name / description)
* @param{String} matterId, unique id of the matter to modify
* @param{Object} fields, fields to update {"name":String, "description":String};
* @return{Object} undefined, there is no return in case of success
**/
function updateMatter_(matterId, fields){
  const url = `https://vault.googleapis.com/v1/matters/${matterId}`;
  var payload = fields;
  
  const result = new APICall().url(url).method('PUT').payload(payload).execute(); 
return result;
}


/**
* close a matter
* @param {String} matterId
* @return tempty string
**/
function closeMatter_(matterId){
  const url = `https://vault.googleapis.com/v1/matters/${matterId}:close`; 
  
  var result = new APICall().url(url).method("POST").execute(); // we are supposed to have a post with an empty body
  return result;
}

/**
* retrive all the matters available for a given user
* @param {String} state, state of the matter ["OPEN","CLOSED", "DELETED"];
* @return {Array} Matters
**/
function getMatters_(stateRaw){
  const states = ["OPEN","CLOSED", "DELETED"];
  var state;
  if(stateRaw !== undefined){
    state = stateRaw.toUpperCase();
    if(states.indexOf(state) == -1){
      throw new Error("Matter state not recognized: "+stateRaw); 
    }
  }
  const url = "https://vault.googleapis.com/v1/matters";
  var optionalArgs = {};
  if(state !== undefined){
    optionalArgs["state"] = state;
  }

  var matters = [];
  
  function juiceResponseMatters(matterRaw){
    let matter = new Matter();
    matter.chargeStatus_(matterRaw);
    this.push(matter);
  }
  
    var result = new APICall().url(url).optionalArgs(optionalArgs).execute();

    if(result.matters){
      result.matters.forEach(juiceResponseMatters, matters);
    }
  return matters;  
}

/**
* retrieve matter detail from it's ID
* @param{String} matterId
* @return{Object} raw matter object
**/
function getMatterById_(matterId){
  const url = `https://vault.googleapis.com/v1/matters/${matterId}?view=FULL`;

  const result = new APICall().url(url).execute();
  return result;
}



/**
* retrieve a bucketFile and save it in Google Drive
* @param{String} BUCKET_NAME
* @param{String} OBJECT_NAME
* @return{Object} file, Google drive file object
**/
function saveToDriveBucketFile_(BUCKET_NAME,OBJECT_NAME){
  const name = OBJECT_NAME.split('/').pop();
  const url = `https://www.googleapis.com/storage/v1/b/${encodeURIComponent(BUCKET_NAME)}/o/${encodeURIComponent(OBJECT_NAME)}`;
  const optionalArgs = {"alt":"media"}
  var result = new APICall().url(url).optionalArgs(optionalArgs).execute();
  var file = DriveApp.createFile(name, result);
  return file;
}
