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
          '$location',
          '$timeout',
          '$scope',
          '$rootScope',
          '$translate',
          '$modal',
          'CedarUser',
          'resourceService',
          'UIMessageService',
          'UISettingsService',
          'AuthorizedBackendService',
          'CONST'
        ];

        function cedarShareModalController($location, $timeout, $scope, $rootScope, $translate, $modal, CedarUser,
                                           resourceService,
                                           UIMessageService, UISettingsService,
                                           AuthorizedBackendService, CONST) {


          //POST           /groups                                    controllers.GroupController.createGroup()
          //{
          //    "name": "Group name",
          //    "description": "Group description"
          //}
          //GET            /groups                                    controllers.GroupController.findGroups()
          //{
          //  "groups": [
          //  {
          //    "id": "https://repo.metadatacenter.orgx/groups/a3447634-39f7-4909-a845-7a2b6f318d46",
          //    "name": "Everybody",
          //    "displayName": "Everybody",
          //  }
          //]
          //}
          //GET            /groups/:id                                controllers.GroupController.findGroup(id: String)
          //PATCH          /groups/:id                                controllers.GroupController.patchGroup(id: String)
          //PUT            /groups/:id                                controllers.GroupController.updateGroup(id: String)
          //{
          //    "name": "Group name",
          //    "description": "Group description"
          //}
          //DELETE         /groups/:id                                controllers.GroupController.deleteGroup(id: String)
          //GET            /groups/:id/members                        controllers.GroupController.getGroupMembers(id: String)
          //{
          //  "users": [
          //  {
          //    "id": "https://metadatacenter.org/users/095fc857-0012-4bcc-92f6-0502b31148f6",
          //    "createdOn": "2016-09-13T15 :16:58-0700",
          //    "createdOnTS": 1473805018,
          //    "lastUpdatedOn": "2016-09-13T15:16:58-0700",
          //    "lastUpdatedOnTS": 1473805018,
          //    "firstName": "Aaron",
          //    "lastName": "Browne",
          //    "email": "brownea@email.chop.edu",
          //    "displayName": "Aaron Browne",
          //    "nodeType": "user",
          //    "isAdministrator" : true,
          //    "isMember" : true
          //  },
          //  {
          //    "id": "https://metadatacenter.org/users/f1605349-743c-4acc-be4b-ace07554f6d9",
          //    "createdOn": "2016-09-09T16:40:03-0700",
          //    "createdOnTS": 1473464403,
          //    "lastUpdatedOn": "2016-09-09T16:40:03-0700",
          //    "lastUpdatedOnTS": 1473464403,
          //    "firstName": "Aaron",
          //    "lastName": "Carlton",
          //    "email": "aaron@ordinaryexperts.com",
          //    "displayName": "Aaron Carlton",
          //    "nodeType": "user"
          //    "isAdministrator" : false,
          //    "isMember" : true
          //  },
          //  {
          //    "id": "https://metadatacenter.org/users/ae6bc5e2-8afd-4558-a9ae-ea694c3e4bea",
          //    "createdOn": "2016-09-09T16:40:04-0700",
          //    "createdOnTS": 1473464404,
          //    "lastUpdatedOn": "2016-09-09T16:40:04-0700",
          //    "lastUpdatedOnTS": 1473464404,
          //    "firstName": "Alejandra",
          //    "lastName": "Gonzalez-Beltran",
          //    "email": "alejandra .gonzalez.beltran@gmail.com",
          //    "displayName": "Alejandra Gonzalez-Beltran",
          //    "nodeType": "user"
          //    "isAdministrator" : true,
          //    "isMember" : false
          //  }
          //]
          //}
          //PUT            /groups/:id/members                        controllers.GroupController.updateGroupMembers(id: String)
          //{
          //  "users": [
          //  {
          //    "id": "https://metadatacenter.org/users/095fc857-0012-4bcc-92f6-0502b31148f6",
          //    "isAdministrator" : true,
          //    "isMember" : true
          //  },
          //  {
          //    "id": "https://metadatacenter.org/users/f1605349-743c-4acc-be4b-ace07554f6d9",
          //    "isAdministrator" : false,
          //    "isMember" : true
          //  },
          //  {
          //    "id": "https://metadatacenter.org/users/ae6bc5e2-8afd-4558-a9ae-ea694c3e4bea",
          //    "isAdministrator" : true,
          //    "isMember" : false
          //  }
          //]
          //}


          var vm = this;

          // share
          vm.canRead = canRead;
          vm.canWrite = canWrite;
          vm.canChangeOwner = canChangeOwner;
          vm.canBeOwner = canBeOwner;
          vm.openShare = openShare;
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


          vm.groupAdmins = [];
          vm.showGroups = false;
          vm.showGroupMembers = true;
          vm.resourceGroups = null;
          vm.giveGroupPermission = 'read';
          vm.typeaheadGroup = null;
          vm.newGroupName = null;
          vm.getId = getId;



          // user permisssions

          function canRead() {
            return hasPermission('read');
          };

          function canWrite() {
            return hasPermission('write');
          };

          function canChangeOwner() {
            return hasPermission('changeowner');
          };

          function hasPermission(permission) {
            var node = getSelectedNode();
            if (node != null) {
              var perms = node.currentUserPermissions;
              if (perms != null) {
                return perms.indexOf(permission) != -1;
              }
            }
            return false;
          };

          function isOwner(node) {
            if (vm.resourcePermissions && vm.resourcePermissions.owner && node) {
              return vm.resourcePermissions.owner.id === node.id;
            }
            return false;
          }

          function canBeOwner(id) {
            var node = getNode(id);
            return id && node && node.nodeType === 'user' && vm.canChangeOwner();
          }



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
            getNodes();
            getPermissions(resource);
          };

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
          };

          function getShares() {
            if (vm.resourcePermissions) {

              vm.resourcePermissions.shares = [];
              for (var i = 0; i < vm.resourcePermissions.groupPermissions.length; i++) {
                var share = {};
                share.permission = vm.resourcePermissions.groupPermissions[i].permission;
                share.node = vm.resourcePermissions.groupPermissions[i].group;
                share.node.nodeType = 'group';
                share.node.name = getName(share.node);
                vm.resourcePermissions.shares.push(share);
              }
              for (var i = 0; i < vm.resourcePermissions.userPermissions.length; i++) {
                var share = {};
                share.permission = vm.resourcePermissions.userPermissions[i].permission;
                share.node = vm.resourcePermissions.userPermissions[i].user;
                share.node.nodeType = 'user';
                share.node.name = getName(share.node);
                vm.resourcePermissions.shares.push(share);
              }

            }
          }

          // write the permissions to the server
          function setPermissions(resource) {

            // rebuild permissions from shares
            vm.resourcePermissions.groupPermissions = [];
            vm.resourcePermissions.userPermissions = [];
            for (var i = 0; i < vm.resourcePermissions.shares.length; i++) {
              var share = vm.resourcePermissions.shares[i];
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
            delete vm.resourcePermissions.shares;

            var id = resource['@id'];
            resourceService.setResourceShare(
                resource,
                vm.resourcePermissions,
                function (response) {
                  vm.resourcePermissions = response;
                  getShares();
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + resource.nodeType.toUpperCase() + '.load.error', error);
                }
            );
          };

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
                        fillDummyGroups(vm.resourceGroups, vm.resourceUsers);
                        vm.selectedGroupId = initNodes(vm.resourceGroups);

                        // resource nodes is the users and groups combined
                        vm.resourceNodes = [];
                        vm.resourceNodes = vm.resourceNodes.concat(vm.resourceUsers);
                        vm.resourceNodes = vm.resourceNodes.concat(vm.resourceGroups);
                        vm.selectedNodeId = initNodes(vm.resourceNodes);

                      },
                      function (error) {
                        UIMessageService.showBackendError('SERVER.' + resource.nodeType.toUpperCase() + '.load.error',
                            error);
                      }
                  );
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + resource.nodeType.toUpperCase() + '.load.error', error);
                }
            );
          }


          // remove the share permission on this node
          function removeShare(node, resource) {
            for (var i = 0; i < vm.resourcePermissions.shares.length; i++) {
              if (node.id === vm.resourcePermissions.shares[i].node.id) {
                vm.resourcePermissions.shares.splice(i, 1);
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
                result = node.firstName + ' ' + node.lastName + ' (' + node.email + ')';
              } else {
                result = node.displayName;
              }
            }
            return result;
          }

          // when selected user changes, reset selected permisison
          function updateUserPermission(id) {
            if (id) {
              var node = getNode(id);
              if (node.nodeType === 'group' && vm.giveNodePermission === 'own') {
                vm.giveNodePermission = 'read';
              }
            }
          }

          // when selected user changes, reset selected permisison
          function addUserToGroup(person, group) {
            var index = group.people.indexOf(person);
            if (index <= -1) {
              group.people.push(person);
            }
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

            for (var i = 0; i < vm.resourcePermissions.shares.length; i++) {
              if (node.id === vm.resourcePermissions.shares[i].node.id) {
                vm.resourcePermissions.shares[i].permission = permission;
                saveShare(resource);
                return true;
              }
            }
            return false;
          }

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
                  vm.resourcePermissions.shares.push(share);
                  saveShare(resource);
                }

              } else {

                // can we just update it
                if (!isOwner(node) && !updateShare(node, permission, resource)) {

                  // create the new share for this group
                  share.permission = permission;
                  share.node = node;
                  share.node.name = getName(node);
                  vm.resourcePermissions.shares.push(share);
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
            console.log(item);
            console.log(model);
            console.log(label);
          }

          function isAdmin(id) {
            var index = vm.groupAdmins.indexOf(id);
            return (index > -1);
          }

          function removeFromGroup(group, person) {
            var index = group.people.indexOf(person);
            group.people.splice(index, 1);

            updateGroupMembers(group)
          }

          function canWriteGroup() {
            return true;

          }

          // TODO add a new group by calling server, when done rebuild group selectors
          function addGroup(name) {

            var group = vm.resourceGroups[0];
            var newGroup = jQuery.extend(true, {}, group);
            newGroup.id = newGroup.id + 'new';
            newGroup.displayName = name;
            vm.resourceGroups.push(newGroup);


            // select the new group
            vm.typeaheadGroup = newGroup;
            vm.typeaheadGroup.name = getName(newGroup);
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

          function createGroup(name) {
            resourceService.createGroup(name, '',
                function (response) {

                  console.log(response);
                  // update display

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + 'group' + '.load.error',
                      error);
                }
            );
          }

          function updateGroupDescription(group) {
            vm.editingDescription = false;
              updateGroup(group);
          };

          function updateGroupName(group) {
            vm.editingName = false;
            if (group.name.length > 0) {
              updateGroup(group);
            }
          };

          function updateGroup(group) {
            resourceService.updateGroup(group,
                function (response) {

                  console.log(response);
                  // update display

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + group.nodeType.toUpperCase() + '.load.error',
                      error);
                }
            );
          };



          function deleteGroup(group) {
            resourceService.deleteGroup(group.id,
                function (response) {

                  console.log(response);
                  vm.typeaheadGroup = null;

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + group.nodeType.toUpperCase() + '.load.error',
                      error);

                  vm.typeaheadGroup = null;  // just for now
                }
            );
          };

          function getGroupMembers(group, successCallback, errorCallback) {
            resourceService.getGroupMembers(group.id,
                function (response) {

                  console.log(response);
                  // update display

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + group.nodeType.toUpperCase() + '.load.error',
                      error);
                }
            );
          };

          function updateGroupAdmin(group, person, value, successCallback, errorCallback) {

            // find the person in this group and update the value
            var users = group.users;
            var index = group.people.indexOf(person);
            if (index > -1) {
              group.people[index].isAdmin = value;
              updateGroupMembers(group);
            }
          };

          function updateGroupMembers(group) {
            resourceService.updateGroupMembers(group,
                function (response) {

                  console.log(response);
                  // update display

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + group.nodeType.toUpperCase() + '.load.error',
                      error);
                }
            );
          };


          function hasSelectedGroup() {
            return vm.typeaheadGroup != null;
          }

          function getSelectedGroup() {
            return vm.typeaheadGroup;
          }

          $scope.$on('shareModalVisible', function (event, params) {

            var visible = params[0];
            var resource = params[1];

            if (visible && resource) {
              vm.modalVisible = visible;
              vm.shareResource = resource;
              openShare(vm.shareResource);
            }
          });

          //TODO remove when we have groups from server
          function getId(group, person) {
            return group.id + ',' + person.id;
          }

          //TODO remove when we have groups from server
          function fillDummyGroups(groups, people) {
            var group = groups[0];
            vm.groupAdmins = [];


            // give the group some people ids
            group.people = [];
            for (var j = 0; j < people.length; j++) {
              var person = people[j];
              group.people.push(person);
              var obj = {};
              obj.id = group.id + ',' + person.id;
              obj.isAdmin = true;
              vm.groupAdmins.push(obj);
            }

            var dummyGroups = groups;
            for (var i = 0; i < 10; i++) {

              var newGroup = jQuery.extend(true, {}, group);
              newGroup.id = newGroup.id + i;
              newGroup.displayName = newGroup.displayName + i;
              dummyGroups.push(newGroup);

              for (var j = 0; j < people.length; j++) {
                var person = people[j];
                var obj = {};
                obj.id = newGroup.id + ',' + person.id;
                obj.isAdmin = true;
                vm.groupAdmins[obj.id] = obj;

              }

            }
            console.log(vm.groupAdmins);
          };

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
          };

        }
      }

    }
)
;