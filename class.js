/*jshint esversion: 6 */

/**
 * A fluent class for making authenticated API calls with automatic retries and pagination.
 * Designed for Google Apps Script.
 *
 * @example
 * const api = new APICall();
 * try {
 *   const results = api
 *     .baseUrl('https://www.googleapis.com/drive/v3')
 *     .endpoint('/files')
 *     .method('GET')
 *     .optionalArgs({ q: "mimeType='image/jpeg'" })
 *     .execute();
 *   console.log(results);
 * } catch (e) {
 *   console.error(e);
 * }
 */
class APICall {
  constructor(){
    this._baseUrl;
    this._endpoint;
    this._url;
    this._method = 'GET'; // Default to GET
    this._payload;
    this._optionalArgs = {};
    this._paginationResultsKey = null; // Key in the response object that contains the array of results to merge
    this._token;
  }

  /** baseUrl
   * @param {string} baseUrl
   */
  baseUrl(baseUrl) {
    if (this._url != undefined) {
      console.warn(`url was already provided: baseUrl+endpoint = url`);
      throw new Error(`url was already provided: baseUrl+endpoint = url`);
    }
    this._baseUrl = baseUrl;
    return this;
  }
  /** endpoint
   * @param {string} endpoint
   */
  endpoint(endpoint) {
    if (this._baseUrl == undefined) {
      console.warn(`you should first provide baseUrl to use endpoint`);
    }
    this._endpoint = endpoint;
    return this;
  }
  /** url
   * @param {string} url
   */
  url(url) {
    if (this._baseUrl != undefined) {
      throw new Error(`baseUrl was already provided, use endpoint instead of url: baseUrl+endpoint = url`);
    }
    if (this._endpoint != undefined) {
      throw new Error(`endpoint was already provided, use baseUrl instead of url: baseUrl+endpoint = url`);
    }
    this._url = url;
    return this;
  }
  /** method
   * @param {String} method
   */
  method(method) {
    const upperMethod = method.trim().toUpperCase();
    if (!["POST", "GET", "DELETE", "PUT", "PATCH"].includes(upperMethod)) {
      throw new Error(`method ${method} is disallowed`);
    }
    this._method = upperMethod;
    return this;
  }
  /** payload
   * @param {Object} payload
   */
  payload(payload) {
    this._payload = payload;
    return this;
  }
  /** optionalArgs
   * @param {Object} optionalArgs
   */
  optionalArgs(optionalArgs) {
    this._optionalArgs = optionalArgs;
    return this;
  }

  /** Appends query parameters to a URL.
   * @private
   * @param {String} url 
   * @param {Object} args 
   * @returns {String} decoratedUrl
   */
  _addUrlArguments(url, args) {
    var urlArguments = '';
    if (Object.keys(args).length > 0) {
      var urlArgs = [];
      for (var i in args) {
        urlArgs.push(i + '=' + encodeURIComponent(args[i]));
      }
      urlArguments = '?' + urlArgs.join('&');
    }
    return url + urlArguments;
  }


  /**
   *  Makes a single authenticated API call using UrlFetchApp.
  * @private
* @param {String} url, url to call
* @param {String} method, [POST, GET, DELETE, PATCH]
* @param {Object} payload, in case of GET request
* @returns {String} contentText
*/
  _authentifiedFetch(url) {
    var params = {
      method: this._method,
      headers: { "Authorization": "Bearer " + this._token },
      muteHttpExceptions: true,
    };

    if (this._method == 'POST' || this._method === 'PUT' || this._method === 'PATCH') {
      params.contentType = 'application/json';
      if (this._payload != undefined) {
        params.payload = JSON.stringify(this._payload);
      }
    }

    var result = UrlFetchApp.fetch(url, params);
    return result;
  }

  /**
   * Wraps the fetch call with exponential backoff for retries.
   * @private
  * @param {String} url, url to fetch
  * @return {String} the content text of the return
  **/
  _expBackoffUrlFetch(url) {
    var result;

    var sleepingPill;
    for (var i = 0; i < 4; i++) {
      try {
        result = this._authentifiedFetch(url);
        if (result.getResponseCode() < 300) {
          break;
        }
      }
      catch (err) {
        console.warn(i + err);
      }
      if (result && result.getResponseCode() == 403) {
        console.warn("expBackoffUrlFetch (403) ==> final stop");
        break;
      }
      if (result && result.getResponseCode() == 404) {
        if (result.getContentText().match("File not found") != null) {
          console.warn("expBackoffUrlFetch (404) File not found ==> final stop");
          break;
        }
      }
      if (i < 3) {
        sleepingPill = (Math.pow(2, (Number(i)) + 1) * 1000) + (Math.round(Math.random() * 1000));
        console.warn(`${(Number(i)) + 1} failed attempt: expBackoffUrlFetch(${url})--> put to sleep for ${sleepingPill}`);
        Utilities.sleep(sleepingPill);
      }
    }
    return result;
  }

  execute() {
    this._token = ScriptApp.getOAuthToken();
    let composedUrl;
    let decoratedUrl;
    let urlArgs = { ...this._optionalArgs };

    if (this._url == undefined && this._baseUrl == undefined) {
      throw new Error(`no url or baseUrl+endpoint defined to perform call`);
    }
    if (this._url == undefined) {
      composedUrl = this._baseUrl + this._endpoint;
    }
    else {
      composedUrl = this._url;
    }

    var response;
    var out = {};
    var loop = false;

    const merge = (...objs) =>
      [...objs].reduce(
        (acc, obj) =>
          Object.keys(obj).reduce((a, k) => {
            let checkMerge = function(va,vb){
                if(va == vb){
                    return va;
                }
                 if (Array.isArray(va) && Array.isArray(vb)){ return va.concat(vb);}
                 if (typeof va === 'string' && typeof vb === 'string'){return [va, vb].join(', ');}
                if (typeof va === 'object' && typeof vb === 'object'){return merge(va, vb);}
                return vb??va;
            };

            acc[k] = acc.hasOwnProperty(k)
              ? checkMerge(acc[k],obj[k])
              : obj[k];
            return acc;
          }, {}),
        {}
      );

    do {
      loop = false;

      if (urlArgs != undefined && urlArgs != {}) {
        decoratedUrl = this._addUrlArguments(composedUrl, urlArgs);
      }

      const result = this._expBackoffUrlFetch(decoratedUrl || composedUrl);

      if (result.getResponseCode() > 300) {
        throw new Error(`[FAILURE] (${result.getResponseCode()}) APICall.execute(url: ${decoratedUrl || composedUrl}, method: ${this._method}, payload: ${JSON.stringify(this._payload)}) ==> ${result.getContentText()}`);
      }

      if (result.getContentText() == "") {
        return "";
      }

      try {
        response = JSON.parse(result.getContentText());
        if (response.nextPageToken != undefined) {
          if (urlArgs == undefined) {
            urlArgs = {};
          }
          urlArgs.pageToken = `${response.nextPageToken}`;
          delete response.nextPageToken;
          loop = true;
        }
        out = merge(out, response);
      }
      catch (err) {
        return result.getContentText();
      }
    }
    while (loop);
    return out;
  }

}
