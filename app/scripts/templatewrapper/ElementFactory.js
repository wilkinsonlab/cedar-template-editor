function ElementFactory() {

  var od = function (value, enumerable, writable, configurable) {
    var d = {};
    if (arguments.length > 0) {
      d.value = value;
    }
    if (arguments.length > 1) {
      d.enumerable = enumerable;
    } else {
      d.enumerable = true;
    }
    if (arguments.length > 2) {
      d.writable = writable;
    } else {
      d.writable = false;
    }
    if (arguments.length > 3) {
      d.configurable = configurable;
    } else {
      d.configurable = false;
    }
    return d;
  };

  var coreJSONSchemaTemplateElementFields = function () {
    var desc = {};
    descriptor(desc).merge(coreJSONSchemaFields());
    return desc;
  };

  var coreJSONSchemaTemplateFields = function () {
    var desc = {};
    descriptor(desc).merge(coreJSONSchemaFields());
    return desc;
  };

  var templateJSONLDContextField = function () {
    var desc = {};
    descriptor(desc).merge(jSONLDContextField());
    return desc;
  };

  var templateElementJSONLDContextField = function () {
    var desc = {};
    descriptor(desc).merge(jSONLDContextField());
    return desc;
  };

  var templateElementJSONLDTypeField = function () {
    var desc = {};
    descriptor(desc).set("@type", ldTypeTemplateElement());
    return desc;
  };

  var templateJSONLDTypeField = function () {
    var desc = {};
    descriptor(desc).set("@type", ldTypeTemplate());
    return desc;
  };

  var jsonLDIDField = function () {
    var desc = {};
    descriptor(desc).set("@id", ldId());
    return desc;
  };

  var templateId = function () {
    var desc = {};
    descriptor(desc).set("_templateId", _templateId());
    return desc;
  };

  var templateElementUIField = function () {
    var desc = {};
    descriptor(desc).set("_ui", _uiTemplateElement());
    return desc;
  };

  var templateUIField = function () {
    var desc = {};
    descriptor(desc).set("_ui", _uiTemplate());
    return desc;
  };

  var provenanceFields = function () {
    var desc = {};
    descriptor(desc).set("pav:createdOn", pavCreatedOn());
    descriptor(desc).set("pav:createdBy", pavCreatedBy());
    descriptor(desc).set("pav:lastUpdatedOn", pavLastUpdatedOn());
    descriptor(desc).set("cedar:lastUpdatedBy", cedarLastUpdatedBy());
    return desc;
  }

  var templateElementPropertiesField = function () {
  };

  var coreJSONSchemaFields = function () {
    var desc = {};
    descriptor(desc).set("$schema", core$schema());
    descriptor(desc).set("type", coreType());
    descriptor(desc).set("title", coreTitle());
    descriptor(desc).set("description", coreDescription());
    descriptor(desc).set("additionalProperties", coreAdditionalProperties());
    return desc;
  };

  var jSONLDContextField = function () {
    var desc = {};
    descriptor(desc).set("@context", ldSchema());
    return desc;
  };

  var _uiTemplateElement = function () {
    var ui = {};
    descriptor(ui).set("title", uiTitle());
    descriptor(ui).set("description", uiDescription());
    descriptor(ui).set("order", uiOrder());
    return od(ui);
  };

  var _uiTemplate = function () {
    var ui = {};
    descriptor(ui).set("title", uiTitle());
    descriptor(ui).set("description", uiDescription());
    descriptor(ui).set("pages", uiPages());
    return od(ui);
  };

  var templateElementRequiredField = function () {
    var desc = {};
    descriptor(desc).set("required", requiredTemplateElement());
    return desc;
  };

  var templateRequiredField = function () {
    var desc = {};
    descriptor(desc).set("required", requiredTemplate());
    return desc;
  };

  var _templateId = function () {
    return od();
  };

  var core$schema = function () {
    return od("http://json-schema.org/draft-04/schema#");
  };

  var coreType = function () {
    return od("object");
  };

  var coreTitle = function () {
    return od();
  };

  var coreDescription = function () {
    return od();
  };

  var coreAdditionalProperties = function () {
    return od(false);
  };

  var ldSchema = function () {
    var sd = {};
    descriptor(sd).set("pav", ldSchemaPav());
    descriptor(sd).set("cedar", ldSchemaCedar());
    return od(sd);
  };

  var ldSchemaPav = function () {
    return od("http://purl.org/pav/");
  };

  var ldSchemaCedar = function () {
    return od("https://schema.metadatacenter.org/core/");
  };

  var ldTypeTemplateElement = function () {
    return od("https://schema.metadatacenter.org/core/TemplateElement");
  };

  var ldTypeTemplate = function () {
    return od("https://schema.metadatacenter.org/core/Template");
  };

  var ldId = function () {
    return od();
  };

  var uiTitle = function () {
    return od();
  };

  var uiDescription = function () {
    return od();
  };

  var uiOrder = function () {
    return od();
  };

  var uiPages = function () {
    return od();
  };

  var pavCreatedOn = function () {
    return od();
  };

  var pavCreatedBy = function () {
    return od();
  };

  var pavLastUpdatedOn = function () {
    return od();
  };

  var cedarLastUpdatedBy = function () {
    return od();
  };

  var requiredTemplateElement = function () {
    return od(["@id"]);
  };

  var requiredTemplate = function () {
    return od(["@id", "_templateId"]);
  };

  this.templateElement = function () {
    var d = {};
    descriptor(d).merge(coreJSONSchemaTemplateElementFields());
    descriptor(d).merge(templateElementJSONLDContextField());
    descriptor(d).merge(templateElementJSONLDTypeField());
    descriptor(d).merge(jsonLDIDField());
    descriptor(d).merge(templateElementUIField());
    descriptor(d).merge(provenanceFields());
    descriptor(d).merge(templateElementRequiredField());
    //model(e).set(PROPERTIES, wrapped(PROPERTIES, templateElementPropertiesField()));
    return d;
  };

  this.template = function () {
    var d = {};
    descriptor(d).merge(coreJSONSchemaTemplateFields());
    descriptor(d).merge(templateJSONLDContextField());
    descriptor(d).merge(templateJSONLDTypeField());
    descriptor(d).merge(jsonLDIDField());
    descriptor(d).merge(templateUIField());
    descriptor(d).merge(provenanceFields());
    descriptor(d).merge(templateId());
    descriptor(d).merge(templateRequiredField());
    //model(e).set(PROPERTIES, wrapped(PROPERTIES, templatePropertiesField()));
    return d;
  };

}