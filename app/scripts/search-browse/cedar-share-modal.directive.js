'use strict';

define([
      'angular',
      'cedar/template-editor/service/cedar-user',
    ], function (angular) {
      angular.module('cedar.templateEditor.searchBrowse.cedarShareModalDirective', [
        'cedar.templateEditor.service.cedarUser'
      ]).directive('cedarShareModal', cedarShareModalDirective);

      cedarShareModalDirective.$inject = ['CedarUser'];

      /**
       *
       * share and group modal
       *
       */
      function cedarShareModalDirective(CedarUser) {

        var directive = {
          bindToController: {
            shareResource: '=',
            modalVisible : '='
          },
          controller      : cedarShareModalController,
          controllerAs    : 'share',
          restrict        : 'E',
          templateUrl     : 'scripts/search-browse/cedar-share-modal.directive.html'
        };

        return directive;

        cedarShareModalController.$inject = [
          '$timeout',
          '$scope',
          '$translate',
          '$uibModal',
          'CedarUser',
          'resourceService',
          'UIMessageService',
          'UISettingsService',
          'AuthorizedBackendService',
          'CONST'
        ];

        function cedarShareModalController($timeout, $scope,  $translate, $uibModal, CedarUser,
                                           resourceService,
                                           UIMessageService, UISettingsService,
                                           AuthorizedBackendService, CONST) {


          var vm = this;

          // shares
          vm.canRead = canRead;
          vm.canWrite = canWrite;
          vm.canChangeOwner = canChangeOwner;
          vm.canChangePermissions = canChangePermissions;
          vm.canBeOwner = canBeOwner;
          vm.saveShare = saveShare;
          vm.getNode = getNode;
          vm.addShare = addShare;
          vm.removeShare = removeShare;
          vm.updateUserPermission = updateUserPermission;
          vm.selectedUserId = null;
          vm.giveUserPermission = 'read';
          vm.selectedGroupId = null;
          vm.selectedNodeId = null;
          vm.giveNodePermission = 'read';
          vm.resourceUsers = null;
          vm.resourcePermissions = null;
          vm.shares = null;
          vm.resourceNodes = null;
          vm.selectedResource = null;
          vm.typeaheadUser = null;
          vm.autoCompleteUserId = null;
          vm.getName = getName;

          // groups
          vm.addGroup = addGroup;
          vm.createGroup = createGroup;
          vm.updateGroup = updateGroup;
          vm.deleteGroup = deleteGroup;
          vm.getGroupMembers = getGroupMembers;
          vm.updateGroupMembers = updateGroupMembers;
          vm.updateGroupAdmin = updateGroupAdmin;
          vm.updateGroupPermission = updateGroupPermission;
          vm.groupTypeaheadOnSelect = groupTypeaheadOnSelect;
          vm.addUserToGroup = addUserToGroup;
          vm.removeFromGroup = removeFromGroup;
          vm.canWriteGroup = canWriteGroup;
          vm.getSelectedGroup = getSelectedGroup;
          vm.hasSelectedGroup = hasSelectedGroup;
          vm.updateGroupName = updateGroupName;
          vm.updateGroupDescription = updateGroupDescription;
          vm.showRemoveGroupConfirm = false;
          vm.editingTitle = false;
          vm.editingDescription = false;
          vm.newTitle = '';
          vm.newDescription = '';


          vm.groupAdmins = [];
          vm.showGroups = false;
          vm.showGroupMembers = true;
          vm.resourceGroups = null;
          vm.giveGroupPermission = 'read';
          vm.typeaheadGroup = null;
          vm.newGroupName = null;


          /* string utils  */

          // sorting strings
          function dynamicSort(property) {
            var sortOrder = 1;
            if (property[0] === "-") {
              sortOrder = -1;
              property = property.substr(1);
            }
            return function (a, b) {
              var result = (a[property].toUpperCase() < b[property].toUpperCase()) ? -1 : (a[property].toUpperCase() > b[property].toUpperCase()) ? 1 : 0;
              return result * sortOrder;
            }
          }

          /* user permissions  */

          // can this user read the selected resource
          function canRead() {
            return resourceService.canRead(getSelectedNode());
          }

          // can this user write the selected resource
          function canWrite() {
            return resourceService.canWrite(getSelectedNode());
          }

          // can this user change the owner of the selected resource
          function canChangeOwner() {
            return resourceService.canChangeOwner(getSelectedNode());
          }

          // can this user change the permissions of the selected resource
          function canChangePermissions() {
            return resourceService.canChangePermissions(getSelectedNode());
          }

          // is this user the owner of the selected resource
          function isOwner(node) {
            if (vm.resourcePermissions && vm.resourcePermissions.owner && node) {
              return vm.resourcePermissions.owner.id === node.id;
            }
            return false;
          }

          // can this user be the owner of the selected resource
          function canBeOwner(id) {
            var node = getNode(id);
            return id && node && node.nodeType === 'user' && vm.canChangeOwner();
          }


          /*  resources */

          function getSelectedNode() {
            return vm.selectedResource;
          }

          function getSelection() {
            return vm.shareResource;
          }

          // get the node for this id
          function getNode(id) {
            if (vm.resourceNodes) {
              for (var i = 0; i < vm.resourceNodes.length; i++) {
                if (vm.resourceNodes[i].id === id) {
                  return vm.resourceNodes[i];
                }
              }
            }
          }

          // is this node a user?
          function isUser(node) {
            return node && (!node.hasOwnProperty('nodeType') || node.nodeType === 'user');
          }

          // save the modified permissions to the server
          function saveShare(resource) {
            setPermissions(resource);
          };

          // read the permissions from the server
          function getPermissions(resource) {
            // get the sharing for this resource
            if (!resource && vm.hasSelection()) {
              resource = vm.getSelection();
            }
            var id = resource['@id'];
            resourceService.getResourceShare(
                resource,
                function (response) {
                  vm.resourcePermissions = response;
                  vm.resourcePermissions.owner.name = getName(vm.resourcePermissions.owner);
                  getShares();
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + resource.nodeType.toUpperCase() + '.load.error', error);
                }
            );
          }

          function getShares() {
            if (vm.resourcePermissions) {
              vm.shares = [];

              //vm.resourcePermissions.shares = [];
              for (var i = 0; i < vm.resourcePermissions.groupPermissions.length; i++) {
                var share = {};
                share.permission = vm.resourcePermissions.groupPermissions[i].permission;
                share.node = vm.resourcePermissions.groupPermissions[i].group;
                share.node.nodeType = 'group';
                share.node.name = getName(share.node);
                vm.shares.push(share);
              }
              for (var i = 0; i < vm.resourcePermissions.userPermissions.length; i++) {
                var share = {};
                share.permission = vm.resourcePermissions.userPermissions[i].permission;
                share.node = vm.resourcePermissions.userPermissions[i].user;
                share.node.nodeType = 'user';
                share.node.name = getName(share.node);
                vm.shares.push(share);
              }
            }
          }

          // write the permissions to the server
          function setPermissions(resource) {

            // rebuild permissions from shares
            vm.resourcePermissions.groupPermissions = [];
            vm.resourcePermissions.userPermissions = [];
            for (var i = 0; i < vm.shares.length; i++) {
              var share = jQuery.extend(true, {}, vm.shares[i]);

              if (share.node.nodeType === 'user') {
                share.user = share.node;
                delete share.node;
                vm.resourcePermissions.userPermissions.push(share);
              } else {
                share.group = share.node;
                delete share.node;
                vm.resourcePermissions.groupPermissions.push(share);
              }
            }

            var id = resource['@id'];
            resourceService.setResourceShare(
                resource,
                vm.resourcePermissions,
                function (response) {
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + resource.nodeType.toUpperCase() + '.load.error', error);
                }
            );
          }

          function initNodes(nodes) {

            var result;
            for (var i = 0; i < nodes.length; i++) {
              nodes[i].name = getName(nodes[i]);
            }
            nodes.sort(dynamicSort("name"));
            if (nodes.length > 0) {
              result = nodes[0].id;
            }
            return result;

          }

          // get all the users and groups on the system
          function getNodes() {

              // get the users
              resourceService.getUsers(
                  function (response) {
                    vm.resourceUsers = response.users;
                    vm.selectedUserId = initNodes(vm.resourceUsers);


                    // get groups
                    resourceService.getGroups(
                        function (response) {
                          vm.resourceGroups = response.groups;
                          vm.selectedGroupId = initNodes(vm.resourceGroups);

                          // resource nodes is the users and groups combined
                          vm.resourceNodes = [];
                          vm.resourceNodes = vm.resourceNodes.concat(vm.resourceUsers);
                          vm.resourceNodes = vm.resourceNodes.concat(vm.resourceGroups);
                          vm.selectedNodeId = initNodes(vm.resourceNodes);

                        },
                        function (error) {
                          UIMessageService.showBackendError('SERVER.GROUPS.load.error',
                              error);
                        }
                    );
                  },
                  function (error) {
                    UIMessageService.showBackendError('SERVER.USERS.load.error', error);
                  }
              );
            }

          // remove the share permission on this node
          function removeShare(node, resource) {
            for (var i = 0; i < vm.shares.length; i++) {
              if (node.id === vm.shares[i].node.id) {
                vm.shares.splice(i, 1);
              }
            }
            for (var i = 0; i < vm.resourcePermissions.userPermissions.length; i++) {
              if (node.id === vm.resourcePermissions.userPermissions[i].user.id) {
                vm.resourcePermissions.userPermissions.splice(i, 1);
                saveShare(resource);
                return;
              }
            }
            for (var i = 0; i < vm.resourcePermissions.groupPermissions.length; i++) {
              if (node.id === vm.resourcePermissions.groupPermissions[i].group.id) {
                vm.resourcePermissions.groupPermissions.splice(i, 1);
                saveShare(resource);
                return;
              }
            }
          }

          // format a name for this node
          function getName(node) {
            var result = "";
            if (node) {
              if (isUser(node)) {
                result = node.firstName + ' ' + node.lastName;
              } else {
                result = node.displayName;
              }
            }
            return result;
          }

          // when selected user changes, reset selected permission
          function updateUserPermission(id) {
            if (id) {
              var node = getNode(id);
              if (node.nodeType === 'group' && vm.giveNodePermission === 'own') {
                vm.giveNodePermission = 'read';
              }
            }
          }

          // when selected user changes, reset selected permission
          function addUserToGroup(user, group) {

            for (var i = 0; i < group.users.length; i++) {
              if (group.users[i].user.id === user.id) {
                return;
              }
            }

            // not there, so add this user
            var member = {};
            member.user = user;
            member.administrator = false;
            member.member = true;
            group.users.push(member);

            updateGroupMembers(group);
          }


          // when selected user changes, reset selected permisison
          function updateGroupPermission(id) {
            if (id) {
              var node = getNode(id);
              if (node.nodeType === 'group' && vm.giveNodePermission === 'own') {
                vm.giveNodePermission = 'read';
              }
            }
          }

          // update the permission for this node
          function updateShare(node, permission, resource) {

            for (var i = 0; i < vm.shares.length; i++) {
              if (node.id === vm.shares[i].node.id) {
                vm.shares[i].permission = permission;
                saveShare(resource);
                return true;
              }
            }
            return false;
          }

          // add this share to the server
          function addShare(id, permission, domId, resource) {

            var node = getNode(id);
            var share = {};
            if (node) {

              if (permission === 'own') {

                var owner = vm.resourcePermissions.owner;

                if (owner.id != id) {

                  // make the node the owner
                  removeShare(node, resource);

                  vm.resourcePermissions.owner = node;

                  share.permission = 'write';
                  share.node = owner;
                  share.node.nodeType = 'user';
                  share.node.name = getName(share.node);
                  vm.shares.push(share);
                  saveShare(resource);
                }

              } else {

                // can we just update it
                if (!isOwner(node) && !updateShare(node, permission, resource)) {

                  // create the new share for this group
                  share.permission = permission;
                  share.node = node;
                  share.node.name = getName(node);
                  vm.shares.push(share);
                  saveShare(resource);
                }
              }
              // scroll to this node
              $timeout(function () {
                var scroller = document.getElementById(domId);
                scroller.scrollTop = scroller.scrollHeight;
              }, 0, false);
            }
          }

          function groupTypeaheadOnSelect(item, model, label) {
            getGroupMembers(vm.typeaheadGroup);
            vm.newTitle = vm.typeaheadGroup.name;
            vm.newDescription = vm.typeaheadGroup.description;
          }

          function isAdmin(id) {
            var index = vm.groupAdmins.indexOf(id);
            return (index > -1);
          }

          function removeFromGroup(member, group) {
            var index = group.users.indexOf(member);
            if (index > -1) {
              group.users.splice(index, 1);
              updateGroupMembers(group);
            }
          }

          // can this user create and update groups
          function canWriteGroup() {
            return true;
          }

          //
          function addGroup(group) {

            vm.resourceGroups.push(group);

            // select the new group
            vm.typeaheadGroup = group;
            vm.typeaheadGroup.name = getName(group);
            vm.newGroupName = '';


            // resource nodes is the users and groups combined
            vm.resourceNodes = [];
            vm.resourceNodes = vm.resourceNodes.concat(vm.resourceUsers);
            vm.resourceNodes = vm.resourceNodes.concat(vm.resourceGroups);
            vm.selectedNodeId = initNodes(vm.resourceNodes);

            $timeout(function () {
              $scope.$apply();
            });
          }

          // create a new group
          function createGroup(name) {
            resourceService.createGroup(name, '',
                function (response) {

                  addGroup(response);
                  getGroupMembers(response);

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.GROUPS.load.error',
                      error);
                }
            );
          }

          function updateGroupDescription(group, description) {

            vm.editingDescription = false;
            if (description.length > 0) {
              group.description = description;
              vm.typeaheadGroup.description = description;
              updateGroup(group);
            }
          }

          function isUniqueName(name) {
            for (var i = 0; i < vm.resourceGroups.length; i++) {
              if ((group.name && vm.resourceGroups[i].name === group.name)) {
                return false;
              }
            }
            return true;
          }

          // update the name of the group
          function updateGroupName(group, name) {
            vm.editingTitle = false;
            if (name.length > 0) {
              group.displayName = name;
              group.name = name;
              vm.typeaheadGroup.displayName = name;
              vm.typeaheadGroup.name = name;
              updateGroup(group);
            }
          }

          // update the details of this group
          function updateGroup(group) {
            resourceService.updateGroup(group,
                function (response) {

                  $timeout(function () {
                    $scope.$apply();
                  });
                },
                function (error) {

                  UIMessageService.showBackendError('SERVER.GROUPS.update.error',
                      error);
                }
            );
          }


          function deleteGroup(group, resource) {
            resourceService.deleteGroup(group.id,
                function (response) {

                  var i = vm.resourceGroups.indexOf(vm.typeaheadGroup);
                  vm.resourceGroups.splice(i, 1);
                  var j = vm.resourceNodes.indexOf(vm.typeaheadGroup);
                  vm.resourceNodes.splice(j, 1);
                  vm.typeaheadGroup = null;

                  // remove the shares for this group
                  var update = false;
                  for (var i=0;i<vm.shares.length;i++) {
                    if (group.id === vm.shares[i].node.id) {
                      vm.shares.splice(i, 1);
                      update = true;
                    }
                  }
                  if (update) {
                    saveShare(resource);
                  }

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.GROUPS.delete.error',
                      error);
                }
            );
          }

          function getGroupMembers(group, successCallback, errorCallback) {

            resourceService.getGroupMembers(group.id,
                function (response) {

                  group.users = response.users;


                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.GROUPS.load.error',
                      error);
                }
            );
          }

          function updateGroupAdmin(member, group, value, successCallback, errorCallback) {

            var index = group.users.indexOf(member);
            if (index > -1) {
              group.users[index].administrator = value;
              updateGroupMembers(group);
            }
          }

          function updateGroupMembers(group) {

            resourceService.updateGroupMembers(group,
                function (response) {
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.GROUPS.load.error',
                      error);
                }
            );
          }

          function hasSelectedGroup() {
            return vm.typeaheadGroup != null;
          }

          function getSelectedGroup() {
            return vm.typeaheadGroup;
          }

          // initialize the share dialog
          function openShare(resource) {
            getResourceDetails(resource);
            vm.selectedNodeId = null;
            vm.selectedUserId = null;
            vm.selectedGroupId = null;
            vm.giveNodePermission = 'read';
            vm.resourceUsers = null;
            vm.resourceGroups = null;
            vm.resourceNodes = null;
            vm.resourcePermissions = null;
            vm.showGroups = false;
            vm.newGroupName = '';
            vm.typeaheadUser = null;
            vm.typeaheadGroup = null;
            vm.editingTitle = false;
            vm.editingDescription = false;
            vm.newTitle = "";
            vm.newDescription = '';

            getNodes();
            getPermissions(resource);
          }

          // share modal just opened
          $scope.$on('shareModalVisible', function (event, params) {

            var visible = params[0];
            var resource = params[1];

            if (visible && resource) {
              vm.modalVisible = visible;
              vm.shareResource = resource;
              openShare(vm.shareResource);
            }
          });

          // get the resource details which includes the share settinh
          function getResourceDetails(resource) {
            if (!resource && vm.hasSelection()) {
              resource = vm.getSelection();
            }
            var id = resource['@id'];
            resourceService.getResourceDetail(
                resource,
                function (response) {
                  vm.selectedResource = response;
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + resource.nodeType.toUpperCase() + '.load.error', error);
                }
            );
          }
        }
      }
    }
)
;
