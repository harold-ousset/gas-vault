/**
* retrieve the lists of exports for a given matter
* @param {String} matterId
* @return {Array} exports
*/
function listExports_(matterId) {
  // https://developers.google.com/vault/reference/rest/v1/matters.exports/list?
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/exports`;

  var exports = [];

  function juiceResponseExports(exprt) {
    this.push(exprt);
  }

  var result = new APICall().url(url).execute();
  if (result.exports) {
    result.exports.forEach(juiceResponseExports, exports);
  }
  return exports;
}

/**
* retrieve the status of a given export
* @param {String} matterId
* @param {String} exportId
* @return {Object} exportData, {id, matterId, name, requester, query, exportOptions, createTime, status, stats, cloudStorageSink}
*/
function getExportInfos_(matterId, exportId) {
  // https://developers.google.com/vault/reference/rest/v1/matters.exports/get
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/exports/${exportId}`;
  const result = new APICall().url(url).execute();
  return result;
}

/**
* DELETE a given export
* @param {String} matterId
* @param {String} exportId
*/
function deleteExport_(matterId, exportId) {
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/exports/${exportId}`;
  const result = new APICall().url(url).method('DELETE').execute();
  return result;
}


/**
* build a user export for a given matter
* @param {String} matterId, unique id of a given matter
* @param {String} account, email address of the requested account
* @param {String} type, export type can be "MAIL" or "DRIVE"
* @param {[String]} name, name of the matter, if not provided name will be "TYPE - account - yyyy-mm-dd"
* @param {Object} options, {exportFormat:[PST,MBOX], terms:"owner:someone@domain.ext"}
* @return {Object} exportInfos, {id, name, type}
*/
function buildUserExport_(matterId, account, rawType, name, options) {
  if (rawType == undefined) {
    throw 'Export type cannot be undefined, select "MAIL" or "DRIVE"';
  }
  var type = rawType.toUpperCase();

  var today = new Date();
  name = name || type + ' - ' + account + ' - ' + today.getFullYear() + '-' + ('0' + (Number(today.getMonth()) + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);

  var query = {
    "corpus": type,
    "method": "ACCOUNT",
    "accountInfo": { "emails": [account] },
    "dataScope": "ALL_DATA"
  };

  var exportOptions = {};

  switch (type) {
    case "MAIL":
      exportOptions = {
        "mailOptions": {
          "exportFormat": "PST"
        }
      };
      break;
    case "DRIVE":
      query.terms = "owner:" + account;
      break;
    default:
      throw "Can't build export, unsupported type " + type;
  }

  if (options != undefined && Object.keys(options).length > 0) {
    for (var opt in options) {
      switch (opt) {
        case 'exportFormat':
          exportOptions.mailOptions.exportFormat = options[opt];
          break;
        case 'terms':
          query.terms = options[opt];
          break;
        default:
          console.warn('Unknown option ' + opt + " : " + options[opt]);
      }
    }
  }

  return buildExport_(matterId, name, query, exportOptions);
}

/**
* build an export for a given matter
* @param {String} matterId, unique id of a given matter
* @param {String} name, of the export
* @param {Object} query
* @param {[Object]} exportOptions
* @return {Object} exportInfos, {id, name, type}
*/
function buildExport_(matterId, name, query, exportOptions) {
  const url = `https://vault.googleapis.com/v1/matters/${matterId}/exports`;
  var payload = {
    "name": name,
    "query": query,
    "exportOptions": exportOptions
  };
  var result = new APICall().url(url).method('POST').payload(payload).execute();
  return result;
}
