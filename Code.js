// script id: 1yXuSYg04wH88jOi47oaPZahRjD3RN20tfkv7eQXrWvhnIi9c09i4q9up

/*
Copyright 2020 Harold Ousset
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/



// https://developers.google.com/apps-script/concepts/manifests
// https://developers.google.com/vault/reference/rest/v1/matters/create

/// "oauthScopes": ["https://www.googleapis.com/auth/ediscovery.readonly", "https://www.googleapis.com/auth/ediscovery", "https://www.googleapis.com/auth/script.external_request"]

/** init a new matter listing
* call method getMatters to retrive the matters eof the acting user
**/
function Listing(){
  this.matters = [];  
}

/** retrieve the matters of the current user 
* @param{[String]} state, the state of the matters to be retrieveds
* @return{Array} matters
**/
Listing.prototype.getMatters = function(state){
  this.matters = getMatters_(state);
  return this.matters;
};


/**
* open an existing matter from it's ID
* @param{String} matterId
* @return{Object} Matter
*/
function openMatterById(matterId){
  var matter = new Matter();
  var matterRaw = getMatterById_(matterId);
  matter.setStatus(matterRaw);
  return matter;
}

/**
 * Create a new matter
 * @param{String} name
 * @param{[String]} description (optional)
 * @return{Object} Matter
 */
function createMatter(name, description){
  var matter = new Matter(name, description);
  matter = matter.create();
  return matter;
}

const MATTER_STATE = {
  OPEN : "OPEN",
  DRAFT : "DRAFT"
}

this.MATTER_STATE = MATTER_STATE;

/**
* init a Matter object as draft
* @param{String} name
* @param{[String]} description
* @return{Object} Matter
*/
function Matter(name, description){
  this.name = name;
  this.description = description;
  this.exports = []; // {id, name, type};
  this.state = MATTER_STATE.DRAFT;
  return this;
}

/**
* set Matter name
* @param{String} name, will be set on matter in draft state
* @return{Object} matter, for chaining
**/
Matter.prototype.setName = function(name){
  if(name === undefined){
   throw "Can't set undefined as name on matter"; 
  }
  if(this.state !== MATTER_STATE.DRAFT){
    updateMatter_(this.matterId, {"name":name, "description":this.description});
  }
  this.name = name;
  return this;
};

/**
* set Matter description
* @param{String} description, 
* @return{Object} matter, for chaining
**/
Matter.prototype.setDescription = function(description){
  if(description === undefined){
   throw "Can't set undefined as description on matter"; 
  }
  if(this.state !== MATTER_STATE.DRAFT){
    updateMatter_(this.matterId, {"description":description, "name":this.name});
  }
  this.description = description;
  return this;
};

/**
* get Matter name
* @return{String} name
**/
Matter.prototype.getName = function(){
  return this.name;
};

/**
* get Matter description
* @return{String} description
**/
Matter.prototype.getDescription = function(){
  return this.description;
};

/**
* get Matter state
* @return{String} state
**/
Matter.prototype.getState = function(){
  return this.state;
}

/**
* set status for a Matter
* @param{Object} status
*/
Matter.prototype.setStatus = function(status){
  for(var i in status){
    this[i] = status[i]; 
  }
};

/**
* create a matter from the draft
* @return{Object} matter, for chaining purpose
**/
Matter.prototype.create = function(){
  if(this.name === undefined){
   throw "Name is mandatory in order to create a matter"; 
  }
  this.matterId = createMatter_(this.name, this.description);
  this.state = MATTER_STATE.OPEN;
  return this;
};

/**
* retrieve a Matter ID
* @return{String} matterId
*/
Matter.prototype.getId = function(){
  return this.matterId; 
};

/**
* close a Matter
*
*/
Matter.prototype.close = function(){
  return closeMatter_(this.matterId);
};

/**
* add a collaborator to a Matter
* @param{String} email
* @param{[String]} role, can be COLLABORATOR" or "OWNER" if argument not provided it will be set to collaborator
* @return{Objet} collaborator
*/
Matter.prototype.addCollaborator = function(email, role){
  var collaborator = addMatterCollaborator_(this.matterId, email, role);
  return collaborator;
};

/**
* remove a collaborator to a Matter
* @param{String} email
* @return{String} confirmation, "removed"
*/
Matter.prototype.removeCollaborator = function(email){
  removeMatterCollaborator_(this.matterId, email);
  return "removed";
};


/**
* create a new user data export from the active matter
* @param{String} account, email address to be searched
* @param{String} exportType, can be MAIL or DRIVE
* @param{[String]} name, title of the export (non mandatory)
* TODO @param{[Object]} options, various options that can be added to the export {exportFormat:[PST,MBOX], query}
* @return{Object} export, an export object
**/
Matter.prototype.createUserExport = function(account, exportType, name, options){
  exportType = exportType || EXPORT_TYPE.MAIL;
  var rawExport = buildExport_(this.matterId, account, exportType, name, options); // rawexportData
  var exprt = new Export(this.matterId, rawExport.id);
  exprt.chargeStatus_(rawExport);
  this.exports.push(exprt);
  return exprt;
};


/**
* get the exports list of a given matter
* @return{Array} exports
**/
Matter.prototype.getExports = function(){
  if(this.exports.length == 0){
    this.listExports(); 
  }
  return this.exports;
};

/**
* open an export by id
* @param{String} exportId
* @return{Object} exportInstance
**/
Matter.prototype.openExportById = function(exportId){
  var exportInstance = getExportInfos_(this.matterId, exportId);
  var exprt = new Export(this.matterId, exportId);
  return exprt;
}


Matter.prototype.listExports = function(){
  var exports = listExports_(this.matterId);
  
  var createExportObj_ = function(exportRaw){
    var exprt = new Export(exportRaw.matterId, exportRaw.id);
    exprt.setStatus(exportRaw);
    return exprt;
  }
  if(exports.length > 0){
    exports = exports.map(createExportObj_);
  }
  this.exports = exports;
  return exports;
};

// #############################################################
// ###################### EXPORT SECTION #######################
// #############################################################


const EXPORT_TYPE ={
  MAIL : "MAIL",
  DRIVE : "DRIVE"
};
this.EXPORT_TYPE = EXPORT_TYPE;

const EXPORT_FORMAT = {
  PST : "PST",
  MBOX : "MBOX"
};
this.EXPORT_FORMAT = EXPORT_FORMAT;

/**
* open export with it's ID and matterID
* @param{String} matterId
* @param{String} exportId
* @return{Object} exportObject
**/
function openExportById(matterId, exportId){
  var exprt = new Export(matterId, exportId);
  exprt.getInfos();
  return exprt;
}

/**
* invoke an export
* @param{String} matterId
* @param{String} exportId
**/
function Export(matterId, exportId){
  this.id = exportId;
  this.matterId = matterId;
}

/**
* get export id
* @return{String} exportId
**/
Export.prototype.getId = function(){
  return this.id;
}

/** set export name
 * @param{String} name
 * @return{Object} Export for chaining
 */
Export.prototype.setName = function(name){
  this.name = name;
  return this;
};

// https://developers.google.com/vault/reference/rest/v1/matters.exports#exportstatus
// EXPORT_STATUS_UNSPECIFIED, COMPLETED, FAILED, IN_PROGRESS
Export.prototype.getStatus = function(){
  var exportData = this.getInfos();
  return exportData.status;
};

/**
* retrieve the informations for a given export
* @return{Object} exportInstance, informations regarding a given export
**/
Export.prototype.getInfos = function(){
  var exportData = getExportInfos_(this.matterId, this.id);
  for(var i in exportData){
    this[i] = exportData[i];
  }
  return exportData
}

/**
* getFiles
* @return{Array} files {bucketName, objectName, size, md5Hash}
**/
Export.prototype.getFiles = function (){
  if(this.cloudStorageSink == undefined){
    var exportData = this.getInfos();
    if(exportData.cloudStorageSink == undefined){
     return []; 
    }
  }
  return this.cloudStorageSink.files || [];
}

/**
* internal function to charge the export with the informations retrieved from the API call
* @param{Object} exportInstance
* @return{Object} this, for parsing purpose
**/
Export.prototype.chargeStatus_ = function(rawData){
  for(var i in rawData){
    this[i] = rawData[i]; 
  }
  return this;
};


Export.prototype.remove = function(){
  deleteExport_(this.matterId, this.id);
};
