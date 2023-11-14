/**
* retrieve the lists of exports for a given matter
* @param{String} matterId
* @return{Array} exports
**/
function listExports_(matterId){
  // https://developers.google.com/vault/reference/rest/v1/matters.exports/list?
  var token = ScriptApp.getOAuthToken();
  var baseUrl ="https://vault.googleapis.com/v1/matters/"+matterId+"/exports";
  var headers = {"Authorization": 'Bearer ' +token};
  var decorator = "";
  var pageToken;
  
  var exports = [];
  
  function juiceResponseExports(exprt){
    this.push(exprt);
  }
  
  do{
    var params = {
      "method":"GET",
      'contentType': 'application/json',
      "headers":headers
    };  
    var result = UrlFetchApp.fetch(baseUrl+decorator, params);
    
    var response = JSON.parse(result.getContentText());
    
    if(response.exports){
      response.exports.forEach(juiceResponseExports, exports);
    }
    
    pageToken = response.nextPageToken;
    decorator = "?pageToken="+pageToken;
  }
  while(pageToken !== undefined);
  return exports;
}

/**
* retrieve the status of a given export
* @param{String} matterId
* @param{String} exportId
*@return{Object} exportData, {id, matterId, name, requester, query, exportOptions, createTime, status, stats, cloudStorageSink}
**/
function getExportInfos_(matterId, exportId){
  // https://developers.google.com/vault/reference/rest/v1/matters.exports/get
  // GET https://vault.googleapis.com/v1/matters/{matterId}/exports/{exportId}
  var token = ScriptApp.getOAuthToken();
  var url = "https://vault.googleapis.com/v1/matters/"+matterId+"/exports/"+exportId;
  var headers = {"Authorization": 'Bearer ' +token};
  var params = {
    "method":"GET",
    'contentType': 'application/json',
    "headers":headers
  };  
  var result = UrlFetchApp.fetch(url, params);
  
  var response = JSON.parse(result.getContentText());
  return response;
}

/**
* DELETE a given export
* @param{String} matterId
* @param{String} exportId
**/
function deleteExport_(matterId, exportId){
  // DELETE https://vault.googleapis.com/v1/matters/{matterId}/exports/{exportId}

  var token = ScriptApp.getOAuthToken();
  var url = "https://vault.googleapis.com/v1/matters/"+matterId+"/exports/"+exportId;
  var headers = {"Authorization": 'Bearer ' +token};
  var params = {
    "method":"DELETE",
    'contentType': 'application/json',
    "headers":headers
  };  
  var result = UrlFetchApp.fetch(url, params);
  
  var response = JSON.parse(result.getContentText());
  return response;
}


/**
* build a user export for a given matter
* @param{String} matterId, unique id of a given matter
* @param{String} account, email address of the requested account
* @param{String} type, export type can be "MAIL" or "DRIVE"
* @param{[String]} name, name of the matter, if not provided name will be "TYPE - account - yyyy-mm-dd"
* @param{Object} options, {exportFormat:[PST,MBOX], terms:"owner:someone@domain.ext"}
* @return{Object} exportInfos, {id, name, type}
**/
function buildUserExport_(matterId, account, rawType, name, options){
  var token = ScriptApp.getOAuthToken();
  var url = "https://vault.googleapis.com/v1/matters/"+matterId+"/exports";
  var headers = {"Authorization": 'Bearer ' +token};
  
  if(rawType == undefined){
    throw 'Export type cannot be undefined, select "MAIL" or "DRIVE"';
  }
  var type = rawType.toUpperCase();
  
  var today = new Date();
  name = name || type+' - '+account+' - '+today.getFullYear()+'-'+('0'+(Number(today.getMonth())+1)).slice(-2)+'-'+('0'+today.getDate()).slice(-2);
  
  var query = {
    "corpus": type,
      "method": "ACCOUNT",
      "accountInfo": {"emails": [account]},
      "dataScope": "ALL_DATA"
  };

  var exportOptions = {};

  
  switch(type){
    case "MAIL":
      exportOptions = {
        "mailOptions": {
          "exportFormat": "PST"
        }
      };
      break;
    case "DRIVE":
      query.terms = "owner:"+account;
      break;
    default:
      throw "Can't build export, unsupported type "+type; 
  }

  if(options != undefined && Object.keys(options).length > 0){
    for (var opt in options){
      switch (opt){
        case 'exportFormat':
          exportOptions.mailOptions.exportFormat = options[opt];
        break;
        case 'terms':
          query.terms = options[opt];
          break;
          default:
          console.warn('Unknown option '+opt+" : "+options[opt]);
      }
    }
  }

  return buildExport_(matterId, name, query, exportOptions);
}

/**
* build an export for a given matter
* @param{String} matterId, unique id of a given matter
* @param{String} name, of the export
* @param{Object} query
* @param{[Object]} exportOptions
* @return{Object} exportInfos, {id, name, type}
**/
function buildExport_(matterId, name, query, exportOptions){
  var token = ScriptApp.getOAuthToken();
  var url = `https://vault.googleapis.com/v1/matters/${matterId}/exports`;
  var headers = {"Authorization": 'Bearer ' +token};
  
  var payload = {
    "name": name,
    "query": query,
    "exportOptions":exportOptions
  };
  
  var params = {
    "method":"POST",
    'contentType': 'application/json',
    "payload":JSON.stringify(payload),
    "headers":headers,
    "muteHttpExceptions":true,
    "followRedirects":false
  };
  
  var result = UrlFetchApp.fetch(url, params);
  if(result.getResponseCode() == 200){
    var ret = JSON.parse(result.getContentText());
    return ret;
  }
  throw result.getContentText();
}