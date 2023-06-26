import axios from '../../lib/axios-instance';
import React, { useEffect, useContext, useState } from 'react';
import CsvUploader from '../csvuploader';
import { Context } from '../../context';
import { setEfiJwt, setSaveFileBucketName, setEfiOrigin } from '../../lib/efi-store';
import isInIframe from '../../lib/is-in-iframe';

const SaasLoader = ({ templateId }) => {
  const { state, dispatch } = useContext(Context);
  const headers = {
    template_id: templateId,
  };

  useEffect(() => {
    window.addEventListener('message', handleParentEvent);
    function handleParentEvent (ev) {
      ev.source.postMessage({ eventType: 'jwtReceived', documentKey: ev.data.documentKey }, ev.origin);

      setEfiJwt(ev.data.jwt);
      setEfiOrigin(ev.origin);
      setSaveFileBucketName(ev.origin);
      dispatch({ type: 'SET_EFI_DATA', payload: { origin: ev.origin, documentKey: ev.data.documentKey } });
      getTemplates();
    }

    if (!isInIframe) {
      console.log('not inside an iframe');
      getTemplates();
    }

    function getTemplates () {
      axios
        .get('/api/templates', { headers })
        .then((result) => {
          console.log('get templates result', result);
          if (result.data.columns) {
            dispatch({
              type: 'SET_SASS_TEMPLATE_COLUMNS',
              payload: result.data.columns,
            });
            dispatch({
              type: 'SET_SASS_BASE_TEMPLATE_ID',
              payload: templateId,
            });
          }
        })
        .catch((err) => console.log(err));
    }

    return () => window.removeEventListener('message', handleParentEvent);
  }, []);

  return (
    <div className='dark:bg-gray-800 h-screen'>
      <div className="flex mx-20 items-center">
        <div className="w-72 p-4 rounded dark:bg-gray-900">
          <div className="flex mb-4 rounded bg-blue-500/25 dark:bg-gray-800 p-2">
            <p className="text-sm text-gray-500 dark:text-gray-200">
              Make sure your file includes the following required columns:
            </p>
          </div>
          <p className="text-md uppercase font-bold text-gray-700 dark:text-gray-200">
            Expected Columns
          </p>
          <hr className="my-2" />
          {state.saasTemplateColumns &&
            state.saasTemplateColumns?.map((column, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <p className="text-gray-700 dark:text-gray-200 py-2">{column.label}</p>
              </div>
            ))}
        </div>
        <div className="w-screen">
          <CsvUploader nextPageRoute={'/saasloadmatcher'} />
        </div>
      </div>
    </div>
  );
};

export default SaasLoader;
