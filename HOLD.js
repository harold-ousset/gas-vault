
/** add several accounts to an hold
 * @param{String} matterId
 * @param{String} holdId
 * @param{Array} accountsEmails, list of emails to add
 * @return{Object} heldAccounts
 */
function addUsersToHold_(matterId, holdId, accountsEmails) {
  //https://developers.google.com/vault/reference/rest/v1/matters.holds/addHeldAccounts
  const method = "POST";
  var url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}:addHeldAccounts`;
  var token = ScriptApp.getOAuthToken();
  var headers = { "Authorization": 'Bearer ' + token };
  var payload = {
    "emails": accountsEmails
  };

  var params = {
    "method": method,
    'contentType': 'application/json',
    "payload": JSON.stringify(payload),
    "headers": headers,
    "muteHttpExceptions": true,
    "followRedirects": false
  };

  var result = UrlFetchApp.fetch(url, params);
  if (result.getResponseCode() < 300) {
    var ret = JSON.parse(result.getContentText());
    return ret;
  }
  throw result.getContentText();
}


/** add account to hold
 * @param{String} matterId
 * @param{String} holdId
 * @param{String} accountEmail
 * @return{Object} heldAccount, as in https://developers.google.com/vault/reference/rest/v1/matters.holds.accounts#HeldAccount
 */
function addUserToHold_(matterId, holdId, accountEmail) {
  // https://developers.google.com/vault/reference/rest/v1/matters.holds.accounts/create
  var url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}/accounts`;
  const method = "POST";
  payload = {
    "email": accountEmail
  };
  var token = ScriptApp.getOAuthToken();
  var headers = { "Authorization": 'Bearer ' + token };

  var params = {
    "method": method,
    'contentType': 'application/json',
    "payload": JSON.stringify(payload),
    "headers": headers,
    "muteHttpExceptions": true,
    "followRedirects": false
  };

  var result = UrlFetchApp.fetch(url, params);
  if (result.getResponseCode() < 300) {
    var ret = JSON.parse(result.getContentText());
    return ret;
  }
  throw result.getContentText();
}


/** list the held accounts for an hold
 * @param{String} matterId
 * @param{String} holdId
 * @return{Array} list HeldAccount
 */
function listHeldAccounts_(matterId, holdId) {
  // https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds.accounts/list
  var token = ScriptApp.getOAuthToken();
  var baseUrl = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}/accounts`;
  var headers = { "Authorization": 'Bearer ' + token };
  var decorator = "";

  var params = {
    "method": "GET",
    'contentType': 'application/json',
    "headers": headers
  };
  var result = UrlFetchApp.fetch(baseUrl + decorator, params);

  var response = JSON.parse(result.getContentText());

  if (response.accounts) {
    return response.accounts;
  }
  throw "couldn't list accounts for hold " + holdId;
}


/**
 * retrieve the lists of holds for a given matter
* @param{String} matterId
* @return{Array} holds
 */
function listHolds_(matterId) {
  // https://developers.google.com/vault/reference/rest/v1/matters.holds/list
  var token = ScriptApp.getOAuthToken();
  var baseUrl = "https://vault.googleapis.com/v1/matters/" + matterId + "/holds";
  var headers = { "Authorization": 'Bearer ' + token };
  var decorator = "";
  var pageToken;

  var holds = [];

  function juiceResponseHolds(hold) {
    this.push(hold);
  }

  do {
    var params = {
      "method": "GET",
      'contentType': 'application/json',
      "headers": headers
    };
    var result = UrlFetchApp.fetch(baseUrl + decorator, params);

    var response = JSON.parse(result.getContentText());

    if (response.holds) {
      response.holds.forEach(juiceResponseHolds, holds);
    }

    pageToken = response.nextPageToken;
    decorator = "?pageToken=" + pageToken;
  }
  while (pageToken !== undefined);
  return holds;
}



/** create a hold on specific users
 * @param{String} matterId, the matter that hold the hold (lol)
 * @param{String} name, given to the hold
 * @param{Array} users, email addresses of the held users (will also work with a string if only one user)
 * @param{String} workspaceService, what service to hold data for
 * @param{[Object]} options, optional parameter to add options
 * @return{Object} rawHold, has in https://developers.google.com/vault/reference/rest/v1/matters.holds#Hold
 */
function createUserHold_(matterId, name, users, workspaceService, options) {
  // https://developers.google.com/vault/reference/rest/v1/matters.holds/create
  var url = `https://vault.googleapis.com/v1/matters/${matterId}/holds`;
  var method = "POST";
  var token = ScriptApp.getOAuthToken();
  var headers = { "Authorization": 'Bearer ' + token };
  var decorator = "";
  if (Array.isArray(users)) {
    var accounts = users;
  }
  else {
    accounts = [users];
  }

  var payload = {
    "name": name,
    "accounts": accounts,
    "corpus": workspaceService,
  };
  if (options != undefined) {
    payload.query = options;
  }

  var params = {
    "method": method,
    'contentType': 'application/json',
    "headers": headers,
    "payload": JSON.stringify(payload)
  };
  var result = UrlFetchApp.fetch(url + decorator, params);
  if (result.getResponseCode() == 200) {
    var response = JSON.parse(result.getContentText());
    return response;
  }
  throw result.getResponseCode() + " - " + result.getContentText();
}

/** get orgUnit ID from path
 * @param{String} orgUnitPath
 * @return{String} orgUnitId
 */
function getOrgUnitId_(orgUnitPath) {
  var ou = AdminDirectory.Orgunits.get(orgUnitPath);
  return ou.orgUnitId;
}


/** create a hold on a OU
 * @param{String} matterId, the matter that hold the hold (lol)
 * @param{String} name, given to the hold
 * @param{String} orgUnit, orgUnit where the hold should apply
 * @param{String} workspaceService, what service to hold data for
 * @param{[Object]} options, optional parameter to add options
 * @return{Object} rawHold, has in https://developers.google.com/vault/reference/rest/v1/matters.holds#Hold
 */
function createOrgUnitHold_(matterId, name, orgUnit, workspaceService, options) {
  // https://developers.google.com/vault/reference/rest/v1/matters.holds/create
  var url = `https://vault.googleapis.com/v1/matters/${matterId}/holds`;
  var method = "POST";
  var token = ScriptApp.getOAuthToken();
  var headers = { "Authorization": 'Bearer ' + token };
  var decorator = "";

  var orgUnitId = getOrgUnitId_(orgUnit);

  var payload = {
    "name": name,
    "orgUnit": { "orgUnitId": orgUnitId },
    "corpus": workspaceService,
  };
  if (options != undefined) {
    payload.query = options;
  }

  var params = {
    "method": method,
    'contentType': 'application/json',
    "headers": headers,
    "payload": JSON.stringify(payload)
  };
  var result = UrlFetchApp.fetch(url + decorator, params);
  if (result.getResponseCode() == 200) {
    var response = JSON.parse(result.getContentText());
    return response;
  }
  throw result.getResponseCode() + " - " + result.getContentText();
}


/** add an account to a hold
 * @param{String} matterId, the matter that hold the hold (lol)
 * @param{String} holdId
 * @param{String} accountEmail, email address of the account to add
 * @return{Object} heldAccount, has in https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds.accounts#HeldAccount
 */
function createHoldUser_(matterId, holdId, accountEmail) {
  // https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds.accounts/create

  var url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}/accounts`;
  var method = "POST";
  var token = ScriptApp.getOAuthToken();
  var headers = { "Authorization": 'Bearer ' + token };
  var decorator = "";

  var payload = {
    "email": accountEmail,
  };

  if (options != undefined) {
    payload.query = options;
  }

  var params = {
    "method": method,
    'contentType': 'application/json',
    "headers": headers,
    "payload": JSON.stringify(payload)
  };
  var result = UrlFetchApp.fetch(url + decorator, params);
  if (result.getResponseCode() == 200) {
    var response = JSON.parse(result.getContentText());
    return response;
  }
  throw result.getResponseCode() + " - " + result.getContentText();

}



/** add several accounts to a hold
 * @param{String} matterId, the matter that hold the hold (lol)
 * @param{String} holdId
 * @param{Array} accountEmails, email addresses of the accounts to add to the hold
 * @return{Object} heldAccount operation result, has in https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds/addHeldAccounts#AddHeldAccountResultaccounts#HeldAccount
 */
function addHeldAccounts_(matterId, holdId, accountEmails) {
  // https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds/addHeldAccounts

  var url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}:addHeldAccounts`;
  var method = "POST";
  var token = ScriptApp.getOAuthToken();
  var headers = { "Authorization": 'Bearer ' + token };
  var decorator = "";

  var accounts = accountEmails.map(account => account.trim().toLowerCase());
  var payload = {
    "emails": accounts
  };

  if (options != undefined) {
    payload.query = options;
  }

  var params = {
    "method": method,
    'contentType': 'application/json',
    "headers": headers,
    "payload": JSON.stringify(payload)
  };
  var result = UrlFetchApp.fetch(url + decorator, params);
  if (result.getResponseCode() == 200) {
    var response = JSON.parse(result.getContentText());
    return response;
  }
  throw result.getResponseCode() + " - " + result.getContentText();
}


/** remove held account from hold
 * @param{String} matterId, the matter that hold the hold (lol)
 * @param{String} holdId
 * @param{String} accountId, as returned by the hold account list
 * @return{Object} empty object
 */
function removeHeldAccount_(matterId, holdId, accountId){
  // https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds.accounts/delete
  var url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}/accounts/${accountId}`;
  var method = "DELETE";
  var token = ScriptApp.getOAuthToken();
  var headers = { "Authorization": 'Bearer ' + token };

  var params = {
    "method": method,
    "headers": headers
  };
  var result = UrlFetchApp.fetch(url + decorator, params);
  if (result.getResponseCode() == 200) {
    var response = JSON.parse(result.getContentText());
    return response;
  }
  throw result.getResponseCode() + " - " + result.getContentText();
}

