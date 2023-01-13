import React, { useState, useRef } from 'react';

import Editor from '@monaco-editor/react';
import { useRouter } from 'next/router';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const JSON_Template = () => {
  const router = useRouter();

  const defaultCode = `{
    "type": "object",
    "properties": {
        "firstName": {
        "type": "string",
        "maxlength": 3,
        "format": "first-name-validation",
        "validate": "(x) => (x.startsWith('chinm') ? true : false)"
        },
        "email": { "type": "string", "format": "email" },
        "dob": { "type": "string", "format": "date" },
        "countryCode": {
        "type": "string",
        "enum": ["US", "CA"]
        }
    },
    "required": ["firstName", "email", "dob", "countryCode"]    
}    
`;

  const [code, setCode] = useState(`{

}`);
  const [templateName, setTemplateName] = useState('');

  const [value, setValue] = useState(code);

  const handleEditorChange = (value) => {
    setValue(value);
    setCode(value);
  };

  const handleClick = () => {
    var json = JSON.stringify(code, function (key, code) {
      if (typeof code === 'function') {
        return code.toString();
      } else {
        return code;
      }
    });

    console.log(json);

    // router.push({ pathname: '/templates' }, undefined, {
    //     shallow: true,
    // });
  };

  return (
    <div>
      <div className="flex px-2">
        <Link href="/templates">
          <div className="flex items-center gap-1">
            <ArrowLeftIcon className="h-5 cursor-pointer" />
            <p className="text-lg font-medium">Back To Templates</p>
          </div>
        </Link>
      </div>
      <div className="flex items-center justify-center gap-10">
        <div className="my-4 border-2 rounded-md p-4 flex flex-col align-middle justify-center w-2/3">
          <div className="flex">
            <div className="flex flex-col w-5/12">
              <h2 className="text-lg font-bold text-gray-500">Name</h2>
              <p className="text-gray-400">Name of the template</p>
            </div>
            <div className="ml-10 flex flex-col justify-center w-72">
              <div className="mb-2">
                <input
                  type="text"
                  id="default-input"
                  className={`border border-gray-300 text-gray-400  text-sm rounded-lg
                   focus:ring-blue-500 focus:border-blue-500 block w-[400px] 
                   p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                    dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        <div className="flex flex-col gap-2 items-center">
          <Editor
            height="70vh"
            width={`50vw`}
            language="json"
            value={value}
            defaultValue={code}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              validate: false,
              renderValidationDecorations: 'off',
            }}
          />
          <button
            type="submit"
            className="py-2.5 px-5 flex
                                text-sm font-medium text-gray-900
                                bg-blue-200 rounded-md
                                border border-gray-200 hover:bg-gray-100 hover:text-blue-700
                                focus:outline-none focus:z-10 focus:ring-4 focus:ring-gray-200
                                dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 "
            onClick={handleClick}
          >
            SAVE
          </button>
        </div>

        <div className="flex flex-col text-sm">
          <SyntaxHighlighter
            language="json"
            wrapLongLines={true}
            style={googlecode}
          >
            {defaultCode}
          </SyntaxHighlighter>
          <div
            className="mt-4 flex items-center justify-center border-2 rounded-md py-1 px-2 text-center cursor-pointer border-blue-300"
            onClick={() => setValue(defaultCode)}
          >
            COPY TO THE EDITOR
          </div>
        </div>
      </div>
    </div>
  );
};

export default JSON_Template;