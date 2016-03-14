'use strict';

define([
  'angular'
], function(angular) {
  angular.module('cedar.templateEditor.controlTerm.controlTermDataService', [])
    .service('controlTermDataService', controlTermDataService);

  controlTermDataService.$inject = ['$http', '$q', 'UrlService'];

  function controlTermDataService($http, $q, UrlService) {

    var apiKey = null;
    var base = null;
    var config = null;
    var http_default_config = {};

    var service = {
      autocompleteOntology: autocompleteOntology,
      autocompleteOntologySubtree: autocompleteOntologySubtree,
      autocompleteValueSetClasses: autocompleteValueSetClasses,
      getAllOntologies: getAllOntologies,
      getClassChildren: getClassChildren,
      getClassDetails: getClassDetails,
      getClassParents: getClassParents,
      getClassTree: getClassTree,
      getClassValueSet: getClassValueSet,
      getGenericEndpoint: getGenericEndpoint,
      getOntologyAcronym: getOntologyAcronym,
      getOntologyCategories: getOntologyCategories,
      getOntologyClasses: getOntologyClasses,
      getOntologyDetails: getOntologyDetails,
      getOntologySize: getOntologySize,
      getOntologyTreeRoot: getOntologyTreeRoot,
      getOntologyValueSets: getOntologyValueSets,
      getValueSetDetails: getValueSetDetails,
      init: init,
      searchClass: searchClass,
      searchOntologyClassesValueSetsAndValueSetClasses: searchOntologyClassesValueSetsAndValueSetClasses,
      searchValueSetsAndValues: searchValueSetsAndValues,
      searchValueSetsAndValueSetClasses: searchValueSetsAndValueSetClasses,
      serviceId: 'controlTermDataService'
    };

    return service;

    /**
     * Initialize service.
     */
    function init() {
      config = cedarBootstrap.getBaseConfig(this.serviceId);
      apiKey = config.apiKey;
      base = UrlService.bioontology();
      http_default_config = {
        'headers': {
          'Authorization': 'apikey token=' + apiKey
        }
      };
    }

    /**
     * Service methods.
     */

    function autocompleteOntology(query, acronym) {
      return $http.get(base + 'search?q=' + query.replace(/[\s]+/g, '+') + '&ontologies=' + acronym + '&suggest=true&display_context=false&display_links=false&pagesize=20', http_default_config).then(function(response) {
        return response.data;
      }).catch(function(err) {
        return err;
      });
    };

    function autocompleteOntologySubtree(query, acronym, subtree_root_id, max_depth) {
      var searchUrl = base;
      if (query == '*') {
        // use descendants
        searchUrl += 'ontologies/' + acronym + '/classes/' + encodeURIComponent(subtree_root_id) + '/descendants?display_context=false&display_links=false';
      } else {
        searchUrl += 'search?q=' + query.replace(/[\s]+/g, '+') + '&ontology=' + acronym + '&suggest=true&display_context=false&display_links=false&subtree_root_id=' + encodeURIComponent(subtree_root_id) + '&max_depth=' + max_depth + '&pagesize=20';
      }
      return $http.get(searchUrl, http_default_config).then(function(response) {
        return response.data;
      }).catch(function(err) {
        return err;
      });
    };

    function autocompleteValueSetClasses(query, uri) {
      var searchUrl = base;
      if (query == '*') {
        // use descendants
        searchUrl += 'ontologies/NLMVS/classes/' + encodeURIComponent(uri) + '/descendants?display_context=false&display_links=false';
      } else {
        searchUrl += 'search?q=' + query.replace(/[\s]+/g, '+') + '&ontology=NLMVS&suggest=true&display_context=false&display_links=false&subtree_root_id=' + encodeURIComponent(uri) + '&pagesize=20'
      }
      return $http.get(searchUrl, http_default_config).then(function(response) {
        return response.data;
      }).catch(function(err) {
        return err;
      });
    };

	function getAllOntologies() {
	  return $http.get(base + 'ontologies/', http_default_config).then(function(response) {
		return response;
	  }).catch(function(err) {
		return err;
	  });
	};

	function getClassChildren(acronym, classId) {
	  //ontologies/{acronym}/classes/{id}/children?include=hasChildren
  	  return $http.get(base + 'ontologies/' + acronym + '/classes/' + encodeURIComponent(classId) + '/children?include=hasChildren,prefLabel', http_default_config).then(function(response) {
		return response.data.collection;
	  }).catch(function(err) {
		return err;
	  });
	};

    /**
     * This function will return some more detailed information on a particular class.
     */
	function getClassDetails(endpoint) {
      endpoint = fixEndpointScheme(endpoint);
   	  return $http.get(endpoint, http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	}

	function getClassParents(acronym, classId) {
	  //ontologies/{acronym}/classes/{id}/parents?include=hasChildren
  	  return $http.get(base + 'ontologies/' + acronym + '/classes/' + encodeURIComponent(classId) + '/parents?include=hasChildren,prefLabel', http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

    function getClassTree(acronym, classId ) {
      //ontologies/{acronym}/classes/{id}/tree
      return $http.get(base + 'ontologies/' + acronym + '/classes/' + encodeURIComponent(classId) + '/tree', http_default_config).then(function(response) {
        return response.data;
      }).catch(function(err) {
        return err;
      });
    };

	function getClassValueSet(acronym, classId) {
	  //ontologies/{acronym}/classes/{id}/children?pagesize={pagesize}
	  return $http.get(base + 'ontologies/' + acronym + '/classes/' + encodeURIComponent(classId) + '/children?pagesize=100', http_default_config).then(function(response) {
		return response.data.collection;
	  }).catch(function(err) {
		return err;
	  });
	};

	function getGenericEndpoint(endpoint) {
	  // Some links within data returned from other requests have fully qualified endpoints so this is
	  // simply a generic helper request function
      endpoint = fixEndpointScheme(endpoint);
	  return $http.get(endpoint, http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

    /**
     * Parses an Ontology Class acronym from a result object.
     */
    function getOntologyAcronym(result) {
      return result.links.ontology.slice(39);
    };

	function getOntologyCategories(acronym, optimize) {
      var uri = base + 'ontologies/' + acronym + '/categories';
      if (optimize) {
        uri = optimizeUri(uri);
      }
	  return $http.get(uri, http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

	function getOntologyClasses(endpointOrAcronym) {
	  var url = fixEndpointScheme(endpointOrAcronym);
	  if (!/\/classes$/i.test(url)) {
		url = base + "ontologies/" + url + "/classes";
	  }

	  return $http.get(url, http_default_config).then(function(response) {
		return response.data.collection;
	  }).catch(function(err) {
		return err;
	  });
	};

	function getOntologyDetails(acronym) {
	  return $http.get(base + 'ontologies/' + acronym + '/latest_submission', http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

	function getOntologySize(acronym, optimize) {
      var uri = base + 'ontologies/' + acronym + '/metrics';
      if (optimize) {
        uri = optimizeUri(uri);
      }
	  return $http.get(uri, http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

	function getOntologyTreeRoot(acronym){
	  //ontologies/{acronym}/classes/roots
	  return $http.get(base + 'ontologies/' + acronym + '/classes/roots', http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

	function getOntologyValueSets(acronym) {
	  //ontologies/NLMVS/classes/roots
	  // Get all value sets that belong to a specific Ontology
	  return $http.get(base + 'ontologies/' + acronym + '/classes/roots?include=hasChildren,prefLabel,definition,properties', http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

	function getValueSetDetails(acronym, classId) {
	  //ontologies/{acronym}/classes/{id}?include=prefLabel,definition,properties
	  var request = base + 'ontologies/' + acronym + '/classes/' + encodeURIComponent(classId) + '?include=prefLabel,definition,properties';
	  return $http.get(request, http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

	function searchClass(query) {
	  // This searchClass() function will run for each additional page of data in the original request,
	  // subsequent requests are made the the full qualified endpoint therefore the request will NOT need
	  // to be sliced to properly format the request

	  //search?q={query}
	  // &require_exact_match will only match the phrase, not any word within the phrase (more accurate)
	  var request = base + 'search?q=' + query.replace(/[\s]+/g, '+') + '&require_exact_match=true';
	  if (query.slice(0, 28) == 'https://data.bioontology.org') {
		request = query;
	  }

      return $http.get(request, http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

    function searchOntologyClassesValueSetsAndValueSetClasses(query) {
	  return $http.get(base + 'search?q=' + query.replace(/[\s]+/g, '+') + '&pagesize=100', http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
    };

	function searchValueSetsAndValues(query) {
	  return $http.get(base + 'search?q=' + query.replace(/[\s]+/g, '+') + '&ontologies=NLMVS', http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

	function searchValueSetsAndValueSetClasses(query) {
	  //search?q={query}&ontologies={acronym}&roots_only=true
	  // &require_exact_match will only match the phrase, not any word within the phrase (more accurate)
	  return $http.get(base + 'search?q=' + query.replace(/[\s]+/g, '+') + '&roots_only=true&require_exact_match=true', http_default_config).then(function(response) {
		return response.data;
	  }).catch(function(err) {
		return err;
	  });
	};

    /**
     * Private methods.
     */

    function fixEndpointScheme(endpoint) {
      return endpoint.replace(/^http:/, 'https:');
    }

    // TODO: respect existing query strings
    function optimizeUri(uri) {
      uri += '?display_context=false&display_links=false';
      return uri;
    }

  }
});
