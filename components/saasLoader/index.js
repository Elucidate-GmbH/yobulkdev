import axios from '../../lib/axios-instance';
import React, { useEffect, useContext, useState } from 'react';
import CsvUploader from '../csvuploader';
import { Context } from '../../context';
import { setEfiJwt, setSaveFileBucketName, setEfiOrigin } from '../../lib/efi-store';
import isInIframe from '../../lib/is-in-iframe';
import Spinner from '../efi/Spinner';

const SaasLoader = ({ templateId }) => {
  const [isLoading, setIsLoading] = useState(true)
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
      dispatch({
        type: 'SET_EFI_DATA',
        payload: {
          origin: ev.origin,
          documentKey: ev.data.documentKey,
          isMobile: ev.data.isMobile
        }
      });
      getTemplates();
    }

    if (!isInIframe) getTemplates();

    function getTemplates () {
      axios
        .get('/api/templates', { headers })
        .then((result) => {
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
          else if (Array.isArray(result.data)) {
            dispatch({
              type: 'SET_SASS_TEMPLATE_COLUMNS',
              payload: result.data.filter(el => el._id === templateId)[0].columns,
            });
            dispatch({
              type: 'SET_SASS_BASE_TEMPLATE_ID',
              payload: templateId,
            });
          }
          setIsLoading(false)
        })
        .catch((err) => {
          setIsLoading(false)
          console.log(err);
        });
    }

    return () => window.removeEventListener('message', handleParentEvent);
  }, []);

  if (isLoading) {
    return (
      <div className='h-screen w-screen relative'>
        <Spinner />
      </div>
    )
  }

  return (
    <div className='dark:bg-gray-800 h-screen'>
      <div className="flex lg:mx-20 flex-col lg:flex-row">
        <div className="w-72 p-4 rounded dark:bg-gray-900">
          <div className="flex mb-4 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-200">
              Make sure your file includes the following required columns:
            </p>
          </div>
          <p className="text-md uppercase font-bold dark:text-gray-200 text-blue-800">
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
