
/** add several accounts to an hold
 * @param{String} matterId
 * @param{String} holdId
 * @param{Array} accountsEmails, list of emails to add
 * @return{Object} heldAccounts
 */
function addUsersToHold_(matterId, holdId, accountsEmails) {
  //https://developers.google.com/vault/reference/rest/v1/matters.holds/addHeldAccounts
  const method = "POST";
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}:addHeldAccounts`;
  const payload = {
    "emails": accountsEmails
  };

  const result = new APICall().url(url).method(method).payload(payload).execute();
  return result;
}


/** add account to hold
 * @param{String} matterId
 * @param{String} holdId
 * @param{String} accountEmail
 * @return{Object} heldAccount, as in https://developers.google.com/vault/reference/rest/v1/matters.holds.accounts#HeldAccount
 */
function addUserToHold_(matterId, holdId, accountEmail) {
  // https://developers.google.com/vault/reference/rest/v1/matters.holds.accounts/create
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}/accounts`;
  const method = "POST";
  const payload = {
    "email": accountEmail
  };

  const result = new APICall().url(url).method(method).payload(payload).execute();
  return result;
}


/** list the held accounts for an hold
 * @param{String} matterId
 * @param{String} holdId
 * @return{Array} list HeldAccount
 */
function listHeldAccounts_(matterId, holdId) {
  // https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds.accounts/list
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}/accounts`;
  const result = new APICall().url(url).execute();

  if (result.accounts) {
    return result.accounts;
  }
  return [];
}


/**
 * retrieve the lists of holds for a given matter
* @param{String} matterId
* @return{Array} holds
 */
function listHolds_(matterId) {
  // https://developers.google.com/vault/reference/rest/v1/matters.holds/list
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/holds`;
  const method = "GET";

  var holds = [];
  const result = new APICall().url(url).execute();
  return result.holds || [];
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
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/holds`;
  const method = "POST";
  var accounts;
  if (Array.isArray(users)) {
    accounts = users;
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

  const result = new APICall().url(url).method(method).payload(payload).execute();
  return result;
}

/** get orgUnit ID from path
 * @param{String} orgUnitPath
 * @return{String} orgUnitId
 */
function getOrgUnitId_(orgUnitPath) {
  const ou = AdminDirectory.Orgunits.get(orgUnitPath);
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
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/holds`;
  const method = "POST";

  const orgUnitId = getOrgUnitId_(orgUnit);

  var payload = {
    "name": name,
    "orgUnit": { "orgUnitId": orgUnitId },
    "corpus": workspaceService,
  };
  if (options != undefined) {
    payload.query = options;
  }

  const result = new APICall().url(url).method(method).payload(payload).execute();
  return result;
}


/** add an account to a hold
 * @param{String} matterId, the matter that hold the hold (lol)
 * @param{String} holdId
 * @param{String} accountEmail, email address of the account to add
 * @return{Object} heldAccount, has in https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds.accounts#HeldAccount
 */
function createHoldUser_(matterId, holdId, accountEmail) {
  // https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds.accounts/create
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}/accounts`;
  const method = "POST";
  const payload = {
    "email": accountEmail,
  };

  if (options != undefined) {
    payload.query = options;
  }

  const result = new APICall().url(url).method(method).payload(payload).execute();
  return result;
}


/** add several accounts to a hold
 * @param{String} matterId, the matter that hold the hold (lol)
 * @param{String} holdId
 * @param{Array} accountEmails, email addresses of the accounts to add to the hold
 * @return{Object} heldAccount operation result, has in https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds/addHeldAccounts#AddHeldAccountResultaccounts#HeldAccount
 */
function addHeldAccounts_(matterId, holdId, accountEmails) {
  // https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds/addHeldAccounts
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}:addHeldAccounts`;
  const method = "POST";
  const accounts = accountEmails.map(account => account.trim().toLowerCase());
  const payload = {
    "emails": accounts
  };

  if (options != undefined) {
    payload.query = options;
  }

  const result = new APICall().url(url).method(method).payload(payload).execute();
  return result;
}


/** remove held account from hold
 * @param{String} matterId, the matter that hold the hold (lol)
 * @param{String} holdId
 * @param{String} accountId, as returned by the hold account list
 * @return{Object} empty object
 */
function removeHeldAccount_(matterId, holdId, accountId) {
  // https://developers.google.com/workspace/vault/reference/rest/v1/matters.holds.accounts/delete
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/holds/${holdId}/accounts/${accountId}`;
  const result = new APICall().url(url).method("DELETE").execute();
  return result;
}

