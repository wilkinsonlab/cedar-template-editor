'use strict';
var WorkspacePage = require('../pages/workspace-page.js');
var ToastyModal = require('../modals/toasty-modal.js');
var MoveModal = require('../modals/move-modal.js');
var CopyModal = require('../modals/copy-modal.js');
var ShareModal = require('../modals/share-modal.js');
var SweetAlertModal = require('../modals/sweet-alert-modal.js');
var testConfig = require('../config/test-env.js');

describe('resource-permissions', function () {
  var workspacePage;
  var toastyModal;
  var moveModal;
  var copyModal;
  var shareModal;
  var sweetAlertModal;

  beforeEach(function () {
    workspacePage = WorkspacePage;
    toastyModal = ToastyModal;
    moveModal = MoveModal;
    copyModal = CopyModal;
    shareModal = ShareModal;
    sweetAlertModal = SweetAlertModal;
    browser.driver.manage().window().maximize();
  });

  afterEach(function () {
    workspacePage.clickLogo();
  });


  /* Move tests */

  it("should move a resource owned by current user to a writable folder", function () {
    // create template and target folder
    var sourceTemplate = workspacePage.createTemplate('Source');
    var targetFolder = workspacePage.createFolder('Target');

    // move template to target folder
    workspacePage.moveResource(sourceTemplate, 'template');
    moveModal.moveToDestination(targetFolder);
    toastyModal.isSuccess();
  });


  it("should move a resource owned by current user to an unwritable folder", function () {
    // create a folder to share with another user
    var sharedFolderTitle = workspacePage.createFolder('Shared');

    // share folder
    shareModal.shareResource(sharedFolderTitle, 'folder', testConfig.testUserName2, false, false);

    // logout current user and login as the user with whom the folder was shared
    workspacePage.logout();
    workspacePage.login(testConfig.testUser2, testConfig.testPassword2);

    // create a template to move to the shared folder
    var sourceTemplate = workspacePage.createTemplate('Source');

    // move created template to shared folder
    workspacePage.moveResource(sourceTemplate, 'template');
    moveModal.moveToUserFolder(testConfig.testUserName1, sharedFolderTitle);
    sweetAlertModal.hasInsufficientPermissions();
    sweetAlertModal.confirm();
  });


  it("should move a writable resource not owned by current user to a writable folder", function () {
    // create source template and target shared folder
    var sourceTemplate = workspacePage.createTemplate('Source');
    var targetFolder = workspacePage.createFolder('Target');

    // share the template and folder
    shareModal.shareResource(sourceTemplate, 'template', testConfig.testUserName1, true, false);
    workspacePage.clickLogo(); // reset search
    shareModal.shareResource(targetFolder, 'folder', testConfig.testUserName1, true, false);

    workspacePage.logout();
    workspacePage.login(testConfig.testUser1, testConfig.testPassword1);

    // go to Test User 2's folder to see the shared folders
    workspacePage.navigateToUserFolder(testConfig.testUserName2);

    // move source to target folder
    workspacePage.moveResource(sourceTemplate, 'template');
    moveModal.moveToDestination(targetFolder);
    toastyModal.isSuccess();
  });


  it("should move a writable resource not owned by current user to an unwritable folder", function () {
    // create source template and target shared folder
    var sourceTemplate = workspacePage.createTemplate('Source');
    var targetFolder = workspacePage.createFolder('Target');

    shareModal.shareResource(sourceTemplate, 'template', testConfig.testUserName2, true, false);
    workspacePage.clickLogo(); // reset search
    shareModal.shareResource(targetFolder, 'folder', testConfig.testUserName2, false, false);

    workspacePage.logout();
    workspacePage.login(testConfig.testUser2, testConfig.testPassword2);
    workspacePage.navigateToUserFolder(testConfig.testUserName1);

    workspacePage.moveResource(sourceTemplate, 'template');
    moveModal.moveToDestination(targetFolder);
    sweetAlertModal.hasInsufficientPermissions();
    sweetAlertModal.confirm();
  });


  it("should move an unwritable resource not owned by current user to an unwritable folder", function () {
    // create source template and target shared folder
    var sourceTemplate = workspacePage.createTemplate('Source');
    var targetFolder = workspacePage.createFolder('Target');

    // share both folders
    shareModal.shareResource(sourceTemplate, 'template', testConfig.testUserName1, false, false);
    workspacePage.clickLogo(); // reset search
    shareModal.shareResource(targetFolder, 'folder', testConfig.testUserName1, false, false);

    workspacePage.logout();
    workspacePage.login(testConfig.testUser1, testConfig.testPassword1);

    // go to Test User 2's folder to see the shared folders
    workspacePage.navigateToUserFolder(testConfig.testUserName2);

    // check that the resource does not have an option to be moved
    workspacePage.rightClickResource(sourceTemplate, 'template');
    expect(workspacePage.createRightClickMoveToMenuItem().isPresent()).toBe(false);
  });



  /* Copy tests */

  it("should copy a resource owned by current user to a writable folder", function () {
    // create template and target folder
    var sourceTemplate = workspacePage.createTemplate('Source');
    var targetFolder = workspacePage.createFolder('Target');

    // copy template to target folder
    workspacePage.copyResource(sourceTemplate, 'template');
    copyModal.copyToDestination(targetFolder);
    toastyModal.isSuccess();
  });


  it("should copy a resource owned by current user to an unwritable folder", function () {
    // create a folder to share with another user
    var sharedFolderTitle = workspacePage.createFolder('Shared');

    // share folder
    shareModal.shareResource(sharedFolderTitle, 'folder', testConfig.testUserName2, false, false);

    // logout current user and login as the user with whom the folder was shared
    workspacePage.logout();
    workspacePage.login(testConfig.testUser2, testConfig.testPassword2);

    // create a template to copy to the shared folder
    var sourceTemplate = workspacePage.createTemplate('Source');

    // copy created template to shared folder
    workspacePage.copyResource(sourceTemplate, 'template');
    copyModal.copyToUserFolder(testConfig.testUserName1, sharedFolderTitle);
    sweetAlertModal.hasInsufficientPermissions();
    sweetAlertModal.confirm();
  });


  it("should copy a writable resource not owned by current user to a writable folder", function () {
    // create source template and target shared folder
    var sourceTemplate = workspacePage.createTemplate('Source');
    var targetFolder = workspacePage.createFolder('Target');

    // share the template and folder
    shareModal.shareResource(sourceTemplate, 'template', testConfig.testUserName1, true, false);
    workspacePage.clickLogo(); // reset search
    shareModal.shareResource(targetFolder, 'folder', testConfig.testUserName1, true, false);

    workspacePage.logout();
    workspacePage.login(testConfig.testUser1, testConfig.testPassword1);

    // go to Test User 2's folder to see the shared folders
    workspacePage.navigateToUserFolder(testConfig.testUserName2);

    // copy source to target folder
    workspacePage.copyResource(sourceTemplate, 'template');
    copyModal.copyToDestination(targetFolder);
    toastyModal.isSuccess();
  });


  it("should copy a writable resource not owned by current user to an unwritable folder", function () {
    // create source template and target shared folder
    var sourceTemplate = workspacePage.createTemplate('Source');
    var targetFolder = workspacePage.createFolder('Target');

    shareModal.shareResource(sourceTemplate, 'template', testConfig.testUserName2, true, false);
    workspacePage.clickLogo(); // reset search
    shareModal.shareResource(targetFolder, 'folder', testConfig.testUserName2, false, false);

    workspacePage.logout();
    workspacePage.login(testConfig.testUser2, testConfig.testPassword2);
    workspacePage.navigateToUserFolder(testConfig.testUserName1);

    workspacePage.copyResource(sourceTemplate, 'template');
    copyModal.copyToDestination(targetFolder);
    sweetAlertModal.hasInsufficientPermissions();
    sweetAlertModal.confirm();
  });


  it("should copy an unwritable resource not owned by current user to an unwritable folder", function () {
    // create source template and target shared folder
    var sourceTemplate = workspacePage.createTemplate('Source');
    var targetFolder = workspacePage.createFolder('Target');

    // share both folders
    shareModal.shareResource(sourceTemplate, 'template', testConfig.testUserName1, false, false);
    workspacePage.clickLogo(); // reset search
    shareModal.shareResource(targetFolder, 'folder', testConfig.testUserName1, false, false);

    workspacePage.logout();
    workspacePage.login(testConfig.testUser1, testConfig.testPassword1);

    // go to Test User 2's folder to see the shared folders
    workspacePage.navigateToUserFolder(testConfig.testUserName2);

    workspacePage.copyResource(sourceTemplate, 'template');
    copyModal.copyToDestination(targetFolder);
    sweetAlertModal.hasInsufficientPermissions();
    sweetAlertModal.confirm();
  });
  

});


