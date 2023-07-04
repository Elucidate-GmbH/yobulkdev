import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { customBoolean, customDateTime } from '../validation-engine';

const processEachColumn = ({ templateObj, colObj }) => {
  if (Object.keys(colObj).some((el) => el == 'validate')) {
    templateObj.validators.push({
      name: colObj['name'],
      valFunc: colObj['validate'],
    });
  } else {
    return colObj;
  }
};

const schemaGenerator = ({ clonedSchema }) => {
  let templateObj = {};
  let clonedSchemaProps = clonedSchema.properties;
  templateObj.validators = [];
  Object.keys(clonedSchemaProps).forEach((k, idx) => {
    processEachColumn({ templateObj, colObj: { name: k, ...clonedSchemaProps[k] } });
    if (clonedSchemaProps[k]?.validate) {
      clonedSchemaProps[k][`validate_${k}`] = true
      delete clonedSchemaProps[k].validate;
    }
  });
  templateObj.schema = {};
  Object.assign(templateObj.schema, clonedSchema);
  return templateObj;
};

//https://ajv.js.org/packages/ajv-errors.html#usage

const ajvCompileCustomValidator = ({ template }) => {
  const ajv = new Ajv({ allErrors: true, coerceTypes: true });
  addFormats(ajv, ['date', 'email']);
  require('ajv-errors')(ajv);

  ajv.addFormat('custom-date-time', customDateTime);
  ajv.addFormat('custom-boolean', customBoolean);

  template.validators?.forEach((validator) => {
    const name = validator.name;
    const validateFn = function(schema, data) {
      const valFunc = new Function('input', validator.valFunc);
      return valFunc(data);
    };
    ajv.addKeyword({
      keyword: `validate_${name}`,
      validate: validateFn,
      errors: false
    });
  });
  return ajv;
};

export { schemaGenerator, ajvCompileCustomValidator };
