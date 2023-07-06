import { CloudArrowUpIcon } from '@heroicons/react/24/solid';
import { useDropzone } from 'react-dropzone';
import React, { useCallback, useContext } from 'react';
import { Context } from '../../context';
import Papa from 'papaparse';
import { useRouter } from 'next/router';
import Stepper from '../stepper';
import Button from '../efi/Button';
import { ButtonTypes } from '../efi/ButtonTypes';

const CsvUploader = ({ isStepperVisible, nextPageRoute }) => {
  const { state, dispatch } = useContext(Context);
  const router = useRouter();

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      dispatch({
        type: 'CURRENT_FILE',
        payload: file,
      });
      const uploadStepOne = ({ target }) => {
        Papa.parse(target, {
          worker: true,
          header: true,
          preview: 15,
          dynamicTyping: true,
          skipEmptyLines: true,
          chunk: function (result, parser) {
            let fileMetaData = result.meta;
            dispatch({
              type: 'CURRENT_FILE_HEADERS',
              payload: fileMetaData.fields,
            });
            dispatch({
              type: 'CURRENT_FILE_SAMPLE_ROWS',
              payload: {
                sampleData: result.data,
                fileHeaders: fileMetaData.fields,
              },
            });

            router.push({ pathname: nextPageRoute }, undefined, {
              shallow: true,
            });
          },
        });
      };
      uploadStepOne({ target: file });
    },
    [dispatch, router]
  );

  /*  accept: [
    '.csv, text/csv, application/csv, text/x-csv, application/x-csv, text/comma-separated-values, text/x-comma-separated-values',
  ], */

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    noClick: !state.efiData.isMobile,
    noKeyboard: true,
    onDrop,
  });

  return (
    <div className="mt-3">
      {isStepperVisible && <Stepper step={1} />}
      <div className="flex justify-center ">
        <div className="dropzone bg-white">
          {!state.efiData.isMobile && <p className='text-lg font-bold text-gray-500'>Upload your CSV</p>}
            <div {...getRootProps()} className='drag_drop_wrapper'>
            <input hidden {...getInputProps()} />
            <CloudArrowUpIcon className='w-16 h-16 text-blue-200' />
            {isDragActive ? (
              <p>Drop the csv here...</p>
            ) : (
              <p className='text-gray-500'>{!state.efiData.isMobile ? 'Drag & Drop' : 'Upload'} your csv here</p>
            )}
          </div>
          {!state.efiData.isMobile && <p className='text-gray-500'>Or</p>}
          <div className="flex w-full justify-center">
            <Button
              onClick={open}
              type={!state.efiData.isMobile ? ButtonTypes.subtle : ButtonTypes.primary}>
              Choose a file
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvUploader;
