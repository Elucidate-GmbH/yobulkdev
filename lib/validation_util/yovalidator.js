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
    if (clonedSchemaProps[k]?.validate) delete clonedSchemaProps[k].validate
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
    const keyword = validator.name;
    const validateFn = new Function('input', validator.valFunc);
    ajv.addKeyword(keyword, {
      validate: validateFn,
      errors: false
    });
  });
  return ajv;
};

export { schemaGenerator, ajvCompileCustomValidator };
