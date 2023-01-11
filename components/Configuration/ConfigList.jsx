import { useEffect, useState } from 'react';
import {
    AttachToImporter,
    AttachToOrganizations,
    AttachToJSONOBJ,
    AttachToWorkspace,
    AttachWebHookURL
} from './index';
import Link from 'next/link';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

import CopyToClipboard from 'react-copy-to-clipboard';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

// const importers = [
//     { value: "63a28875cvc26427b0bc320e", label: "63a28875cvc26427b0bc320e" },
//     { value: "43a26875cdc26427b0bc370e", label: "43a26875cdc26427b0bc370e" },
//     { value: "63a29875c2c26427b0b1390e", label: "63a29875c2c26427b0b1390e" },
//     { value: "61a28075cbc2642750bc910e", label: "61a28075cbc2642750bc910e" },
//     { value: "46a28875ccc26427b0bc360e", label: "46a28875ccc26427b0bc360e" },
// ];

// const organizations = [
//     {
//         value: 'Company A',
//         label: 'Company A',
//     },
//     {
//         value: 'Company B',
//         label: 'Company B',
//     },
//     {
//         value: 'Company C',
//         label: 'Company C',
//     },
//     {
//         value: 'Company D',
//         label: 'Company D',
//     },
// ];

const jsonOBJ = [
    {
        value: 'Object A',
        label: 'Object A',
    },
    {
        value: 'Object B',
        label: 'Object B',
    },
    {
        value: 'Object C',
        label: 'Object C',
    },
];

// const workspaces = [
//     {
//         value: 'Workspace #A',
//         label: 'Workspace #A',
//     },
//     {
//         value: 'Workspace #B',
//         label: 'Workspace #B',
//     },
//     {
//         value: 'Workspace #C',
//         label: 'Workspace #C',
//     },
// ];

const ConfigList = () => {
    const [organizations, setOrganizations] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [importers, setImporters] = useState([]);
    const [attachToImporters, setAttachToImporters] = useState(null);
    const [attachToOrganizations, setAttachToOrganizations] = useState(null);
    const [attachThemeJSONObj, setAttachThemeJSONObj] = useState(null);
    const [attachToWorkspace, setAttachToWorkspace] = useState(null);
    const [attachWebHookURL, setAttachWebHookURL] = useState(null);

    const [configurationData, setConfigurationData] = useState(null);
    const [error, setError] = useState(null);

    const [code, setCode] = useState(`import { YoButton } from "yoembed";
import "./App.css";

function App() {
    return (
    <div className="App">
        <h2>This is my SAAS</h2>
        <hr />
        <br />
        <YoButton
            importId="63a28875cbc26427b0bc390e"
            yoHostUrl={"http://localhost:3000"}
        />
    </div>
    );
}

export default App;`);

    const handleClick = (e) => {
        e.preventDefault();
        if (!attachToImporters || !attachToOrganizations || !attachThemeJSONObj || !attachToWorkspace || !attachWebHookURL) {
            setError('*Please fill all the fields');
            return;
        }

        setConfigurationData({
            attachToImporters, attachToOrganizations, attachThemeJSONObj, attachToWorkspace, attachWebHookURL
        });
    };

    useEffect(() => {
        if (configurationData) {
            setCode(`import { YoButton } from "yoembed";
import "./App.css";

function App() {
    return (
    <div className="App">
        <h2>This is my SAAS</h2>
        <hr />
        <br />
        <YoButton
            importId="${configurationData.attachToImporters.value}"
            yoHostUrl={"http://localhost:3000"}
        />
    </div>
    );
}

export default App;`
            );
        }
    }, [configurationData]);


    useEffect(()=>{
        // fetch and set templates
        axios
        .get('/api/templates')
        .then((res) => {
            let listOfTemplates = res.data.filter((el) => el['template_name']).map((el) => {return {value: el._id, label: el.template_name}})
            setImporters(listOfTemplates);
        })
        .catch((e) => console.log(e));

        // fetch and set organizations
        axios
        .get('/api/organizations')
        .then((res) => {
            setOrganizations(res.data.map((el) => {return {value: el.orgName, label: el.orgName}}));
        })
        .catch((e) => console.log(e));

        // fetch and set workspaces
        axios
        .get('/api/organizations')
        .then((res) => {
            setWorkspaces(res.data.map((el) => {return {value: el.workspaces[0].workspaceName, label: el.workspaces[0].workspaceName}}))
        })
        .catch((e) => console.log(e));
    },[]);

    useEffect(() => {
        if (attachToImporters && attachToOrganizations && attachThemeJSONObj && attachToWorkspace && attachWebHookURL) {
            setError('');
        }
    }, [attachThemeJSONObj, attachToImporters, attachToOrganizations, attachToWorkspace, attachWebHookURL]);

    return (
        <div className='py-1 px-2 align-middle justify-between'>
            <div className="flex flex-col px-6 gap-2 align-middle justify-between">
                <Link href="/configuration">
                    <button className='flex items-center gap-1 rounded-full text-blue-500 font-medium hover:bg-blue-50 px-2 w-fit'>
                        <ChevronLeftIcon className="w-4 h-4" />
                        <p className='subpixel-antialiased '>Back to list</p>
                    </button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-500">Create a Importer Configuration</h1>
            </div>

            <div className="flex">
                <form className='p-5 w-7/12'>
                    <div className=' border-2 rounded-md py-1 px-2 align-middle justify-between'>
                        <AttachToImporter
                            attachToImporters={attachToImporters}
                            setAttachToImporters={setAttachToImporters}
                            importers={importers}
                        />

                        <AttachToOrganizations
                            attachToOrganizations={attachToOrganizations}
                            setAttachToOrganizations={setAttachToOrganizations}
                            organizations={organizations}
                        />

                        <AttachToWorkspace
                            attachToWorkspace={attachToWorkspace}
                            setAttachToWorkspace={setAttachToWorkspace}
                            workspaces={workspaces}
                        />
                    </div>

                    <div className='mt-4 border-2 rounded-md py-1 px-2 align-middle justify-between'>
                        <AttachToJSONOBJ
                            attachThemeJSONObj={attachThemeJSONObj}
                            setAttachThemeJSONObj={setAttachThemeJSONObj}
                            jsonOBJ={jsonOBJ}
                        />
                    </div>

                    <div className='mt-4 border-2 rounded-md py-1 px-2 align-middle justify-between'>
                        <AttachWebHookURL
                            attachWebHookURL={attachWebHookURL}
                            setAttachWebHookURL={setAttachWebHookURL}
                        />

                        <div className="flex p-4 align-middle items-center">
                            <div className="flex flex-col w-5/12">
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                            </div>

                            <div className="justify-center ml-auto">
                                <button
                                    type="submit"
                                    className="py-2.5 px-5 flex
                                text-sm font-medium text-gray-900
                                bg-white rounded-md
                                border border-gray-200 hover:bg-gray-100 hover:text-blue-700
                                focus:outline-none focus:z-10 focus:ring-4 focus:ring-gray-200
                                dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 "
                                    onClick={handleClick}
                                >
                                    SAVE
                                </button>
                            </div>
                        </div>
                    </div>

                </form >

                <div className="p-5 w-5/12 border-gray-200">
                    <div className='border-2 rounded-md py-1 px-2 align-middle justify-between'>
                        <SyntaxHighlighter
                            language="javascript"
                            showLineNumbers={true}
                            wrapLongLines={true}
                            style={googlecode}
                        >
                            {code}
                        </SyntaxHighlighter>

                        <CopyToClipboard
                            text={code}
                            onCopy={() => alert("Copied")}
                        >
                            <div className='mt-4 flex items-center justify-center border-2 rounded-md py-1 px-2 text-center cursor-pointer border-blue-300'>
                                <DocumentDuplicateIcon
                                    className="h-5 w-5"
                                    aria-hidden="true" />
                                {" "} COPY
                            </div>
                        </CopyToClipboard>
                    </div>
                </div>
            </div>

        </div >
    );
};

export default ConfigList;
