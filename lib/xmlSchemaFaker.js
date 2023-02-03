/* eslint-disable */
const _ = require('lodash');

function convertSchemaToXML(name, schema, attribute, indentChar, indent) {
  var tagPrefix = '',
    cIndent = _.times(indent, _.constant(indentChar)).join('');
  name = _.get(schema, 'xml.name', name || 'element');
  if (_.get(schema, 'xml.prefix')) {
    tagPrefix = schema.xml.prefix ? `${schema.xml.prefix}:` : '';
  }
  if (['integer','string', 'boolean', 'number'].includes(schema.type)) {
    if (schema.type === 'integer') {
      actualValue = '(integer)';
    }
    else if (schema.type === 'string') {
      actualValue = '(string)';
    }
    else if (schema.type === 'boolean') {
      actualValue = '(boolean)';
    }
    else if (schema.type === 'number') {
      actualValue = '(number)';
    }
    if (attribute) {
      return actualValue;
    }
    else {
      var retVal = `\n${cIndent}<${tagPrefix+name}`;
      if (_.get(schema, 'xml.namespace')) {
        retVal += ` xmlns:${tagPrefix.slice(0,-1)}="${schema.xml.namespace}"`
      }
      retVal += `>${actualValue}</${tagPrefix}${name}>`;
    }
  }
  else if (schema.type === 'object') {
    // go through all properties
    var retVal = '\n' + cIndent + `<${tagPrefix}${name}`, propVal, attributes = [], childNodes = '';
    if (_.get(schema, 'xml.namespace')) {
      let formattedTagPrefix = tagPrefix ?
        `:${tagPrefix.slice(0,-1)}` :
        '';
      retVal += ` xmlns${formattedTagPrefix}="${schema.xml.namespace}"`
    }
    _.forOwn(schema.properties, (value, key) => {
      propVal = convertSchemaToXML(key, value, _.get(value, 'xml.attribute'), indentChar, indent + 1);
      if (_.get(value, 'xml.attribute')) {
        attributes.push(`${key}="${propVal}"`);
      }
      else {
        childNodes += _.isString(propVal) ? propVal : '';
      }
    });
    if (attributes.length > 0) {
      retVal += ' ' + attributes.join(' ');
    }
    retVal += '>';
    retVal += childNodes;
    retVal += `\n${cIndent}</${tagPrefix}${name}>`;
  }
  else if (schema.type === 'array') {
    // schema.items must be an object
    var isWrapped = _.get(schema, 'xml.wrapped'),
      extraIndent = isWrapped ? 1 : 0,
      arrayElemName = _.get(schema, 'items.xml.name', name, 'arrayItem'),
      schemaItemsWithXmlProps = _.cloneDeep(schema.items),
      contents;

    schemaItemsWithXmlProps.xml = schema.xml;
    contents = convertSchemaToXML(arrayElemName, schemaItemsWithXmlProps, false, indentChar, indent + extraIndent) +
      convertSchemaToXML(arrayElemName, schemaItemsWithXmlProps, false, indentChar, indent + extraIndent);
    if (isWrapped) {
      return `\n${cIndent}<${tagPrefix}${name}>${contents}\n${cIndent}</${tagPrefix}${name}>`;
    }
    else {
      return contents;
    }
  }
  return retVal;
}

module.exports = function(name, schema, indentCharacter) {
  // substring(1) to trim the leading newline
  return convertSchemaToXML(name, schema, false, indentCharacter, 0).substring(1);
};
/*
a = convertSchemaToXML('Person',{
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "format": "int32",
      "xml": {
        "attribute": true
      }
    },
    "name": {
      "type": "string",
      "xml": {
        "namespace": "http://example.com/schema/sample",
        "prefix": "sample"
      }
    },
    "animals": {
      "type": "array",
      "items": {
        "type": "string",
        "xml": {
          "name": "animal"
        }
      },
      "xml": {
        "name": "aliens",
        "wrapped": true
      }
    }
  },
  xml: {
    namespace: "www.kane.com",
    "prefix": "M"
  }
}, false, 0);

console.log(a);
*/
