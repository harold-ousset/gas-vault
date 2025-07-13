// script id: 1yXuSYg04wH88jOi47oaPZahRjD3RN20tfkv7eQXrWvhnIi9c09i4q9up

/*
Copyright 2025 Harold Ousset
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


/** retrieve the matters of the current user 
* @param {[String]} state, the state of the matters to be retrieveds
* @return {Array} matters
*/
function listMatters(state) {
  var matters = getMatters_(state);
  return matters;
};

/**
* open an existing matter from it's ID
* @param {String} matterId
* @return {Object} Matter
*/
function openMatterById(matterId) {
  var matter = new Matter();
  var matterRaw = getMatterById_(matterId);
  matter.chargeStatus_(matterRaw);
  return matter;
}

/**
 * Create a new matter
 * @param {String} name
 * @param {[String]} description (optional)
 * @return {Object} Matter
 */
function createMatter(name, description) {
  var matter = new Matter(name, description);
  matter = matter.create();
  return matter;
}

const MATTER_STATE = {
  STATE_UNSPECIFIED: "STATE_UNSPECIFIED",
  DRAFT: "DRAFT",
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  DELETED: "DELETED"
}
this.MATTER_STATE = MATTER_STATE;

/**
* init a Matter object as draft
* @param {String} name
* @param {[String]} description
* @return {Object} Matter
*/
function Matter(name, description) {
  this.name = name;
  this.description = description;
  this.exports = []; // {id, name, type};
  this.state = MATTER_STATE.DRAFT;
  return this;
}

/**
* set Matter name
* @param {String} name, will be set on matter in draft state
* @return {Object} matter, for chaining
*/
Matter.prototype.setName = function (name) {
  if (name === undefined) {
    throw new Error("Cannot set an undefined name on a matter.");
  }
  if (this.state !== MATTER_STATE.DRAFT) {
    updateMatter_(this.matterId, { "name": name, "description": this.description });
  }
  this.name = name;
  return this;
};

/**
* set Matter description
* @param {String} description, 
* @return {Object} matter, for chaining
*/
Matter.prototype.setDescription = function (description) {
  if (description === undefined) {
    throw new Error("Cannot set undefined as description on matter");
  }
  if (this.state !== MATTER_STATE.DRAFT) {
    updateMatter_(this.matterId, { "description": description, "name": this.name });
  }
  this.description = description;
  return this;
};

/**
* get Matter name
* @return {String} name
*/
Matter.prototype.getName = function () {
  return this.name;
};

/**
* get Matter description
* @return {String} description
*/
Matter.prototype.getDescription = function () {
  return this.description;
};

/**
* get Matter state
* @return {String} state
*/
Matter.prototype.getState = function () {
  return this.state;
}

/**
* set status for a Matter
* @param {Object} status
*/
Matter.prototype.chargeStatus_ = function (status) {
  for (var i in status) {
    this[i] = status[i];
  }
};

Matter.prototype.getInfos = function () {
  var matterData = getMatterById_(this.matterId);
  this.chargeStatus_(matterData);
  return matterData;
};

/**
* create a matter from the draft
* @return {Object} matter, for chaining purpose
*/
Matter.prototype.create = function () {
  if (this.name === undefined) {
    throw new Error("Name is mandatory in order to create a matter");
  }
  this.matterId = createMatter_(this.name, this.description);
  this.state = MATTER_STATE.OPEN;
  return this;
};


/** update name and description of a matter 
* @return {Object} matter, for chaining purpose
*/
Matter.prototype.update = function () {
  if (this.state === MATTER_STATE.DRAFT) {
    throw new Error("Cannot update a matter in DRAFT state. Use create() first.");
  }
  const payload = { "name": this.name, "description": this.description };
  updateMatter_(this.matterId, payload);
  return this;
};


/**
* retrieve a Matter ID
* @return {String} matterId
*/
Matter.prototype.getId = function () {
  return this.matterId;
};

/**
* close a Matter
* @return {String} state: "CLOSED"
*/
Matter.prototype.close = function () {
  let matterCloseCode = closeMatter_(this.matterId);
  return matterCloseCode == 200 ? "CLOSED" : "Could not close matter";
};

/**
* add a collaborator to a Matter
* @param {String} email
* @param {[String]} role, can be COLLABORATOR" or "OWNER" if argument not provided it will be set to collaborator
* @return {Objet} collaborator
*/
Matter.prototype.addCollaborator = function (email, role) {
  var collaborator = addMatterCollaborator_(this.matterId, email, role);
  return collaborator;
};

/**
* remove a collaborator to a Matter
* @param {String} email
* @return {String} confirmation, "removed"
*/
Matter.prototype.removeCollaborator = function (email) {
  removeMatterCollaborator_(this.matterId, email);
  return "removed";
};

/**
* create a new user data export from the active matter
* @param {String} account, email address to be searched
* @param {String} exportType, can be MAIL or DRIVE
* @param {[String]} name, title of the export (non mandatory)
* TODO @param {[Object]} options, various options that can be added to the export {exportFormat:[PST,MBOX], query}
* @return {Object} export, an export object
*/
Matter.prototype.createUserExport = function (account, exportType, name, options) {
  if (account == undefined) {
    throw new Error('empty account is not allowed to create a userExport');
  }
  if (exportType == undefined) {
    throw new Error('empty exportType is not allowed to create a userExport');
  }
  exportType = exportType || EXPORT_TYPE.MAIL;
  var rawExport = buildUserExport_(this.matterId, account, exportType, name, options); // rawexportData
  var exprt = new Export(this.matterId, rawExport.id);
  exprt.chargeStatus_(rawExport);
  this.exports.push(exprt);
  return exprt;
};

/**
* create an export from the active matter
* @param {String} name, given to the export
* @param {Object} query, as defined in the documentation https://developers.google.com/vault/reference/rest/v1/Query
* @param {[Object]} exportOptions, as defined in the documentation https://developers.google.com/vault/reference/rest/v1/matters.exports#ExportOptions
* @return {Object} export, an export object
*/
Matter.prototype.createExport = function (name, query, exportOptions) {
  if (name == undefined) {
    throw new Error('empty name is not allowed to create an export');
  }
  if (query == undefined) {
    throw new Error('empty query is not allowed to create an export');
  }
  var rawExport = buildExport_(this.matterId, name, query, exportOptions); // rawexportData
  var exprt = new Export(this.matterId, rawExport.id);
  exprt.chargeStatus_(rawExport);
  this.exports.push(exprt);
  return exprt;
};

/**
* get the exports list of a given matter
* @return {Array} exports
*/
Matter.prototype.getExports = function () {
  if (this.exports.length == 0) {
    this.listExports();
  }
  return this.exports;
};

/**
* open an export by id
* @param {String} exportId
* @return {Object} exportInstance
*/
Matter.prototype.openExportById = function (exportId) {
  var exportInstance = getExportInfos_(this.matterId, exportId);
  var exprt = new Export(this.matterId, exportId);
  return exprt;
}

/**
* list the exports of a given matter
* @return {Array} exports
*/
Matter.prototype.listExports = function () {
  var exports = listExports_(this.matterId);

  var createExportObj_ = function (exportRaw) {
    var exprt = new Export(exportRaw.matterId, exportRaw.id);
    exprt.chargeStatus_(exportRaw);
    return exprt;
  }
  if (exports.length > 0) {
    exports = exports.map(createExportObj_);
  }
  this.exports = exports;
  return exports;
};

/** list holds for a given matter
 * @return {Array} holds
 */
Matter.prototype.listHolds = function () {
  var holds = listHolds_(this.matterId);
  console.log(holds);

  var createHoldObj_ = function (holdRaw) {
    //console.log(`adding hold (${holdRaw.holdId}) to list from matter: ${this.getId()}`)
    var hold = new Hold(this.getId(), holdRaw.holdId);
    hold.chargeStatus_(holdRaw);
    hold.getMatterName = this.getName();
    return hold;
  }
  if (holds.length > 0) {
    holds = holds.map(createHoldObj_, this);
  }
  this.holds = holds;
  return holds;
}


/**
* open an hold by id
* @param {String} holdId
* @return {Object} hold
*/
Matter.prototype.openHoldById = function (holdId) {
  var holdInstance = getHoldInfos_(this.matterId, holdId);
  var hold = new Hold(this.matterId, holdId);
  hold.matterName = this.getName();
  return hold;
}


// #############################################################
// ###################### EXPORT SECTION #######################
// #############################################################


const EXPORT_TYPE = {
  MAIL: "MAIL",
  DRIVE: "DRIVE"
};
this.EXPORT_TYPE = EXPORT_TYPE;

const EXPORT_FORMAT = {
  PST: "PST",
  MBOX: "MBOX"
};
this.EXPORT_FORMAT = EXPORT_FORMAT;

/**
* open export with it's ID and matterID
* @param {String} matterId
* @param {String} exportId
* @return {Object} exportObject
*/
function openExportById(matterId, exportId) {
  var exprt = new Export(matterId, exportId);
  exprt.getInfos();
  return exprt;
}

/**
* invoke an export
* @param {String} matterId
* @param {String} exportId
*/
function Export(matterId, exportId) {
  this.id = exportId;
  this.matterId = matterId;
}

/**
* get export id
* @return {String} exportId
*/
Export.prototype.getId = function () {
  return this.id;
}

/**
* get export name
* @return {String} exportName
*/
Export.prototype.getName = function () {
  return this.name;
}

/** set export name
 * @param {String} name
 * @return {Object} Export for chaining
 */
Export.prototype.setName = function (name) {
  this.name = name;
  return this;
};

/**
 * get the status of a given export
 * @return {String} status, EXPORT_STATUS_UNSPECIFIED, COMPLETED, FAILED, IN_PROGRESS
 * https://developers.google.com/vault/reference/rest/v1/matters.exports#exportstatus
 */
Export.prototype.getStatus = function () {
  var exportData = this.getInfos();
  return exportData.status;
};

/**
* retrieve the informations for a given export
* @return {Object} exportInstance, informations regarding a given export
*/
Export.prototype.getInfos = function () {
  var exportData = getExportInfos_(this.matterId, this.id);
  for (var i in exportData) {
    this[i] = exportData[i];
  }
  return exportData
}

/**
* getFiles
* @return {Array} files {bucketName, objectName, size, md5Hash}
*/
Export.prototype.getFiles = function () {
  if (this.cloudStorageSink == undefined) {
    var exportData = this.getInfos();
    if (exportData.cloudStorageSink == undefined) {
      return [];
    }
  }
  return this.cloudStorageSink.files || [];
}

/**
* internal function to charge the export with the informations retrieved from the API call
* @param {Object} exportInstance
* @return {Object} this, for parsing purpose
*/
Export.prototype.chargeStatus_ = function (rawData) {
  for (var i in rawData) {
    this[i] = rawData[i];
  }
  return this;
};

/**
 * Delete the current Export
 * @return null
 */
Export.prototype.remove = function () {
  deleteExport_(this.matterId, this.id);
};


// #############################################################
// ###################### HOLD SECTION #########################
// #############################################################


/**
* open hold with it's ID and matterID
* @param {String} matterId
* @param {String} holdId
* @return {Object} holdObject
**/
function openHoldById(matterId, holdId) {
  var hold = new Hold(matterId, holdId);
  hold.getInfos();
  return hold;
}

/**
 * search for holds for a given email
 * @param {String} heldAccount
 * @return {Array} list of holdObjects
 * Note: this function can take a large time to run
 */
function searchHoldsAccounts(heldAccount) {
  var holds = [];
  var heldAccount = heldAccount.trim().toLowerCase();
  var matters = listMatters("OPEN");
  console.log(`retrieved ${matters.length} matters`);

  var parseHold = function (hold) {
    let accounts = hold.listAccounts();
    var pullAccount = function (account) {
      if (account.email == heldAccount) {
        holds.push(hold);
      }
    };
    accounts.forEach(pullAccount);
  };

  parseMatter = function (matter) {
    let holds = matter.listHolds();
    holds.forEach(parseHold);
  };

  matters.forEach(parseMatter);
  return holds;
}

/**
* invoke an hold
* @param {String} matterId
* @param {String} holdId
**/
function Hold(matterId, holdId) {
  this.id = holdId;
  this.matterId = matterId;
}

/**
* get hold id
* @return {String} holdId
**/
Hold.prototype.getId = function () {
  return this.id;
}

/**
* get hold name
* @return {String} holdName
**/
Hold.prototype.getName = function () {
  return this.name;
}

/** get Matter parent name
 * @return {String} matterName
 */
Hold.prototype.getMatterName = function () {
  this.matterId;
  if (this.matterName != undefined) {
    return this.getMatterName;
  }
  let matter = openMatterById(this.matterId);
  return matter.getName();
}

/** get hold matter parent Id
 * @return {String} matterId
 */
Hold.prototype.getMatterId = function () {
  const matterId = `${this.matterId}`;
  return matterId;
}

/** set hold name
 * @param {String} name
 * @return {Object} Hold for chaining
 */
Hold.prototype.setName = function (name) {
  this.name = name;
  return this;
};

/**
 * get the status of a given hold
 * @return {String} status, EXPORT_STATUS_UNSPECIFIED, COMPLETED, FAILED, IN_PROGRESS
 * https://developers.google.com/vault/reference/rest/v1/matters.holds#holdstatus
 */
Hold.prototype.getStatus = function () {
  var holdData = this.getInfos();
  return holdData.status;
};

/**
* retrieve the informations for a given hold
* @return {Object} holdInstance, informations regarding a given hold
*/
Hold.prototype.getInfos = function () {
  var holdData = getHoldInfos_(this.matterId, this.id);
  for (var i in holdData) {
    this[i] = holdData[i];
  }
  return holdData
}

/**
* internal function to charge the hold with the informations retrieved from the API call
* @param {Object} holdInstance
* @return {Object} this, for parsing purpose
*/
Hold.prototype.chargeStatus_ = function (rawData) {
  for (var i in rawData) {
    this[i] = rawData[i];
  }
  return this;
};

/** add one user (account) to a hold
 * @param {String} accountEmail, primary email address of the user to add
 * @return {Object} hold, for chaining
 */
Hold.prototype.addAccount = function (accountEmail) {
  createHoldUser_(this.matterId, this.id, accountEmail.trim().toLowerCase());
  return this;
}

/** add several accounts to a hold
 * @param {Array} accountsEmails, email list of the account to add
 * @return {Array} operationResultForEachAccount
 */
Hold.prototype.addAccounts = function (accountEmails) {
  let result = addHeldAccounts_(this.matterId, this.id, accountEmails);
  return result.responses;
}

/** remove an account from an hold*/
Hold.prototype.removeAccount = function (accountEmail) {
  let accounts = this.listAccounts();
  let accountToRemove = accounts.filter(account => account.email == accountEmail.trim().toLowerCase());
  let result = removeHeldAccount_(this.matterId, this.id, accountToRemove.accountId);
  return result == {};
}

/** list the accounts held in a hold
 * @return {Array} heldAccounts like in https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds.accounts#HeldAccount
 */
Hold.prototype.listAccounts = function () {
  if (this.accounts != undefined) {
    return this.accounts;
  }
  return listHeldAccounts_(this.matterId, this.id);
}
