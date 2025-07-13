# GAS-Vault
A comprehensive library for interacting with the Google Vault API to manage eDiscovery matters, holds, and exports within Google Workspace.
## Overview

This library provides an object-oriented approach to managing Google Vault resources. It handles API requests, authentication, pagination, and error handling (including exponential backoff), offering a simplified interface for common Vault operations.


**Library Script ID:** `1yXuSYg04wH88jOi47oaPZahRjD3RN20tfkv7eQXrWvhnIi9c09i4q9up`

---

## Installation

To use this library in your Google Apps Script project, follow these steps:

1.  Open your Google Apps Script project.
2.  In the script editor, next to "Libraries," click the **+** symbol.
3.  In the "Script ID" field, paste the Vault library Script ID:
    ```
    1yXuSYg04wH88jOi47oaPZahRjD3RN20tfkv7eQXrWvhnIi9c09i4q9up
    ```
4.  Click **Look up**.
5.  Select the latest stable version.
6.  The default "Identifier" should be `Vault`. Ensure this is set.
7.  Click **Add**.

You can now access the library's functions using the `Vault` identifier (e.g., `Vault.listMatters()`).

Alternatively you can copy the script from:  
- github: `gh repo clone harold-ousset/gas-vault`  
- [Google apps script file](https://script.google.com/home/projects/1yXuSYg04wH88jOi47oaPZahRjD3RN20tfkv7eQXrWvhnIi9c09i4q9up/edit)

### Prerequisites & Scopes

To use this library, your script project (the one consuming the library) needs specific permissions and services enabled.

#### 1. OAuth Scopes

When you install the library, Apps Script should automatically detect and request the necessary scopes. Ensure the following are included in your project's manifest (`appsscript.json`):

```json
"oauthScopes": [
  "https://www.googleapis.com/auth/ediscovery",
  "https://www.googleapis.com/auth/ediscovery.readonly",
  "https://www.googleapis.com/auth/script.external_request",
  // Required for managing collaborators and holds:
  "https://www.googleapis.com/auth/admin.directory.user.readonly", 
  "https://www.googleapis.com/auth/admin.directory.orgunit.readonly"
]
```

#### 2. Advanced Services

The library uses the **Admin SDK Directory API** to manage matter collaborators and holds. You must enable this advanced service in your project:

1.  In the script editor, next to "Services," click the **+** symbol.
2.  Select **Admin SDK API**.
3.  Click **Add**.

#### 3. Google Cloud Setup

The user running the script must have appropriate Google Vault permissions within your Google Workspace organization.

---

## Basic Usage Example

```javascript
function manageVaultMatter() {
  // 1. Create a new matter
  const matterName = "HR Investigation - Case 101";
  const description = "Investigation regarding policy violation.";
  
  let matter;
  try {
    matter = Vault.createMatter(matterName, description);
    Logger.log(`Created Matter ID: ${matter.getId()}`);
  } catch (e) {
    Logger.log(`Error creating matter: ${e.message}`);
    return;
  }

  // 2. Add a collaborator
  try {
    matter.addCollaborator("legal.team@example.com", "OWNER");
    Logger.log("Added legal team as owner.");
  } catch (e) {
    Logger.log(`Error adding collaborator: ${e.message}`);
  }

  // 3. Create an export for a user's mail
  const userEmail = "employee@example.com";
  const exportType = Vault.EXPORT_TYPE.MAIL;
  const exportOptions = { exportFormat: Vault.EXPORT_FORMAT.MBOX };

  const userExport = matter.createUserExport(userEmail, exportType, null, exportOptions);
  Logger.log(`Started Export ID: ${userExport.getId()} with status: ${userExport.getStatus()}`);

  // 4. List all open matters
  const openMatters = Vault.listMatters(Vault.MATTER_STATE.OPEN);
  Logger.log(`Found ${openMatters.length} open matters.`);
}
```

---

## API Reference

### Core Functions (Accessed via `Vault.*`)

#### `Vault.createMatter(name, [description])`
Creates a new matter in Google Vault.

*   **Parameters:**
    *   `name` (String): The name of the new matter.
    *   `description` (String, Optional): A description for the matter.
*   **Returns:** `(Matter)` A `Matter` object instance.

#### `Vault.openMatterById(matterId)`
Opens an existing matter by its ID.

*   **Parameters:**
    *   `matterId` (String): The unique ID of the matter.
*   **Returns:** `(Matter)` A `Matter` object instance.

#### `Vault.listMatters([state])`
Retrieves a list of matters the user has access to.

*   **Parameters:**
    *   `state` (String, Optional): Filters matters by state (use `Vault.MATTER_STATE`).
*   **Returns:** `(Array<Matter>)` An array of `Matter` objects.

#### `Vault.openExportById(matterId, exportId)`
Opens an existing export.

*   **Parameters:**
    *   `matterId` (String): The ID of the parent matter.
    *   `exportId` (String): The ID of the export.
*   **Returns:** `(Export)` An `Export` object instance.

#### `Vault.openHoldById(matterId, holdId)`
Opens an existing hold.

*   **Parameters:**
    *   `matterId` (String): The ID of the parent matter.
    *   `holdId` (String): The ID of the hold.
*   **Returns:** `(Hold)` A `Hold` object instance.

#### `Vault.searchHoldsAccounts(heldAccount)`
Searches all open matters to find holds that apply to a specific user. *Note: This can be slow as it iterates through all accessible open matters.*

*   **Parameters:**
    *   `heldAccount` (String): The email address of the user to search for.
*   **Returns:** `(Array<Hold>)` An array of `Hold` objects the user is subject to.

---

### Constants

#### `Vault.MATTER_STATE`
Enum for the lifecycle states of a Matter.
*   `OPEN`
*   `CLOSED`
*   `DELETED`
*   `DRAFT`
*   `STATE_UNSPECIFIED`

#### `Vault.EXPORT_TYPE`
Enum for the type of data being exported.
*   `MAIL`
*   `DRIVE`

#### `Vault.EXPORT_FORMAT`
Enum for the format of mail exports.
*   `PST`
*   `MBOX`

---

Of course. Here is the class method documentation formatted into Markdown tables for clarity.

---

### Class: `Matter`

Instances of the `Matter` class are returned by `Vault.createMatter`, `Vault.openMatterById`, and `Vault.listMatters`.

| Method                                                     | Description                                                                                             | Returns                               |
| :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------ |
| **Information Retrieval**                                  |                                                                                                         |                                       |
| `.getId()`                                                 | Returns the unique ID of the matter.                                                                    | `String`                              |
| `.getName()`                                               | Returns the name of the matter.                                                                         | `String`                              |
| `.getDescription()`                                        | Returns the description of the matter.                                                                  | `String`                              |
| `.getState()`                                              | Returns the current state of the matter (e.g., "OPEN").                                                 | `String`                              |
| `.getInfos()`                                              | Fetches the latest data for the matter from the API and updates the object's properties.                | `Object` (Raw API data)               |
| **Management**                                             |                                                                                                         |                                       |
| `.setName(name)`                                           | Sets the name. Automatically calls the Vault API to update the matter if it's already created.          | `Matter` (for chaining)               |
| `.setDescription(description)`                             | Sets the description. Automatically calls the Vault API to update the matter if it's already created.     | `Matter` (for chaining)               |
| `.update()`                                                | Explicitly pushes local changes to the matter's name and description to the Vault API.                  | `Matter` (for chaining)               |
| `.close()`                                                 | Closes the matter.                                                                                      | `String` ("CLOSED" on success)        |
| **Collaborators**                                          |                                                                                                         |                                       |
| `.addCollaborator(email, [role])`                          | Adds a user as a collaborator. `role` can be `"COLLABORATOR"` (default) or `"OWNER"`.                     | `Object` (Collaborator info)          |
| `.removeCollaborator(email)`                               | Removes a collaborator from the matter.                                                                 | `String` ("removed")                  |
| **Exports**                                                |                                                                                                         |                                       |
| `.listExports()`                                           | Lists all exports associated with this matter by calling the Vault API.                                 | `Array<Export>`                       |
| `.getExports()`                                            | Returns the locally cached list of exports. If the cache is empty, it calls `.listExports()` first.     | `Array<Export>`                       |
| `.openExportById(exportId)`                                | Opens a specific export within this matter.                                                             | `Export`                              |
| `.createUserExport(account, exportType, [name], [options])`| Helper to create an export for a single user. `exportType` is from `Vault.EXPORT_TYPE`.                 | `Export`                              |
| `.createExport(name, query, [exportOptions])`              | Creates an export using a complex Vault Query object.                                                   | `Export`                              |
| **Holds**                                                  |                                                                                                         |                                       |
| `.listHolds()`                                             | Lists all legal holds associated with this matter by calling the Vault API.                             | `Array<Hold>`                         |
| `.openHoldById(holdId)`                                    | Opens a specific hold within this matter.                                                               | `Hold`                                |

---

### Class: `Export`

Represents a Vault data export. Instances are returned by `Matter` export methods.

| Method         | Description                                                                                         | Returns                   |
| :------------- | :-------------------------------------------------------------------------------------------------- | :------------------------ |
| `.getId()`     | Returns the unique ID of the export.                                                                | `String`                  |
| `.getName()`   | Returns the name of the export.                                                                     | `String`                  |
| `.getStatus()` | Fetches the current status from the API (e.g., `COMPLETED`, `IN_PROGRESS`, `FAILED`).               | `String`                  |
| `.getInfos()`  | Refreshes the export object with the latest data from the API and updates its properties.           | `Object` (Raw API data)   |
| `.getFiles()`  | If the export status is `COMPLETED`, returns the list of downloadable Cloud Storage files.          | `Array<Object>`           |
| `.remove()`    | Deletes the export from the matter.                                                                 | `void`                    |

---

### Class: `Hold`

Represents a legal hold on data. Instances are returned by `Matter` hold methods.

| Method                       | Description                                                                                    | Returns                   |
| :--------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------ |
| **Information Retrieval**    |                                                                                                |                           |
| `.getId()`                   | Returns the unique ID of the hold.                                                             | `String`                  |
| `.getName()`                 | Returns the name of the hold.                                                                  | `String`                  |
| `.getMatterId()`             | Returns the ID of the parent matter.                                                           | `String`                  |
| `.getMatterName()`           | Returns the name of the parent matter.                                                         | `String`                  |
| `.getInfos()`                | Refreshes the hold object with the latest data from the API and updates its properties.        | `Object` (Raw API data)   |
| **Account Management**       |                                                                                                |                           |
| `.listAccounts()`            | Lists all accounts subject to this hold.                                                       | `Array<Object>`           |
| `.addAccount(accountEmail)`  | Adds a single user account to the hold.                                                        | `Hold` (for chaining)     |
| `.addAccounts(emails)`       | Adds multiple user accounts (as an array of emails) to the hold in a single batch operation.   | `Array<Object>`           |
| `.removeAccount(email)`      | Removes a single user account from the hold.                                                   | `Boolean`                 |