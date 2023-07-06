import React, {useState, useCallback, useEffect, useContext} from 'react';
import FileDownload from 'js-file-download';
import axios from '../../lib/axios-instance';
import HappyModal from './happyModal';
import { CloudArrowDownIcon } from '@heroicons/react/24/outline';
import ErrorTypeDropDown from './errorTypeSelector';
import WarningModal from './warningModal';
import { Switch } from '@headlessui/react';
import SuccessModal from './SuccessModal';
import { FaMagic } from 'react-icons/fa';
import AutoFixModal from './AutoFixModal';
import { Context } from '../../context';
import Button from '../efi/Button';
import { ButtonTypes } from '../efi/ButtonTypes';

const ReviewCsv = ({
  collectionName,
  fileName,
  fileMetaData,
  setIsErrorFree,
  showOnlyErrors,
  selectErrorType,
  getAiRecommendations,
  loadingSuggestions,
  columnDefs,
  runAutofix,
  openAutofixModal,
  autofixValues,
  undoAutoFix
}) => {
  const [metaData, setMetaData] = useState();
  const [downloadig, setDownloadig] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isWarningModalVisible, setWarningModalVisible] = useState(false);
  const [isDownloadWarningModalVisible, setDownloadWarningModalVisible] =
    useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [onlyError, setOnlyError] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const { state } = useContext(Context);

  const [isOpen, setIsOpen] = useState(false);
  const hideUploaderExtraButtons = process.env.NEXT_PUBLIC_HIDE_UPLOADER_BUTTONS === 'true';

  const openModal = () => {
    setIsOpen(true)
    openAutofixModal()
  };
  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    setMetaData((prev) => {
      if (fileMetaData && typeof fileMetaData.validRecords !== 'undefined') {
        if (fileMetaData.totalRecords - fileMetaData.validRecords === 0) {
          setIsErrorFree(true);
          setShowWarning(false);
          setIsVisible(true);
          setTimeout(() => {
            setIsErrorFree(false);
          }, 10000);
        }
      }
      return fileMetaData;
    });
  }, [fileMetaData]);

  const onBtnExport = useCallback(
    (forceDownload) => {
      if (showWarning && !forceDownload) {
        setDownloadWarningModalVisible(true);
        return;
      }
      setDownloadWarningModalVisible(false);
      setDownloadig(true);
      var options = {
        method: 'GET',
        url: '/api/downloads',
        responseType: 'blob',
        headers: {
          collection_name: collectionName,
        },
      };
      axios(options).then((response) => {
        FileDownload(response.data, fileName);
        setDownloadig(false);
      });
    },
    [showWarning]
  );

  const onBtnSubmit = useCallback(() => {
    if (showWarning) {
      setWarningModalVisible(true);
      return;
    } else {
      setShowResultModal(true);
      return;
    }
  }, [showWarning]);

  const submitFirstModal = () => {
    setWarningModalVisible(false);
    setShowResultModal(true);
  };

  const onFinalSubmit = () => {
    setTimeout(() => {
      window.top.postMessage(
        { eventType: "closeImporter", documentKey: state.efiData.documentKey },
        state.efiData.origin
      )
    }, 500)
    setShowResultModal(false);
  };

  const handleSwitch = () => {
    setOnlyError(!onlyError);
    showOnlyErrors(!onlyError);
  };

  return (
    <div className="flex flex-nowrap justify-between relative flex-col lg:flex-row">
      <div className="flex float-left gap-5 flex-wrap lg:flex-nowrap">
        <div className="flex-auto w-auto text-gray-900 p-2">
          All Rows{' '}
          <span className="text-xs ml-1 inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
            {metaData && metaData.totalRecords ? metaData.totalRecords < 1000 ? metaData.totalRecords : metaData.totalRecords / 1000 + 'k' : 0}
          </span>
        </div>
        <div className="flex-auto w-auto text-gray-900 p-2">
          Valid Rows
          <span className="text-xs ml-2 inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-green-200 text-gray-600 rounded-full">
            {metaData && typeof metaData.validRecords !== 'undefined'
              ? metaData.validRecords
              : 'Loading...'}
          </span>
        </div>{' '}
        <div className="flex-auto w-auto text-red-600 p-2">
          Error Rows
          <span className="text-xs ml-2 inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-red-600 text-white rounded-full">
            {metaData && typeof metaData.validRecords !== 'undefined'
              ? metaData.totalRecords - metaData.validRecords
              : 'Loading...'}
          </span>
        </div>{' '}
        <div className="flex items-center w-auto text-gray-900 mb-1">
          Only Errors
          <Switch
            checked={onlyError}
            onChange={handleSwitch}
            className="ml-2 mt-1"
          >
            <div
              className={`${onlyError ? 'bg-blue-500' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full`}
            >
              <span
                className={`${onlyError ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition`}
              />
            </div>
          </Switch>
        </div>{' '}
        <div className="flex-auto w-auto">
          <ErrorTypeDropDown
            errData={metaData}
            selectErrorType={selectErrorType}
          />
        </div>
      </div>
      <div className="flex justify-flex-end gap-3 mt-12 lg:mt-0">
        {!hideUploaderExtraButtons &&
          <button
            onClick={getAiRecommendations}
            className={`flex float-right bg-transparent h-8 px-2 py-1 m-2 text-sm hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded ml-auto ${loadingSuggestions && 'text-white border-none bg-blue-200 hover:bg-blue-200'}`}
            disabled={loadingSuggestions}
          >
            {loadingSuggestions ? 'Getting suggestions...' : 'Get YoBulkAI Suggestions'}
          </button>}

        <div className="flex justify-end">
          {!hideUploaderExtraButtons &&
            <>
              <button
                onClick={undoAutoFix}
                className="flex items-center bg-transparent h-8 px-2 py-1 m-2 text-sm hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded mr-3"
              >
                <FaMagic className="w-5 mr-1" />
                Undo Auto Fix
              </button>

              <button
                onClick={openModal}
                className="flex items-center bg-transparent h-8 px-2 py-1 m-2 text-sm hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded mr-3"
              >
                <FaMagic className="w-5 mr-1" />
                Auto Fix
              </button>
            </>
          }

          {!hideUploaderExtraButtons &&
            <AutoFixModal
              isOpen={isOpen}
              closeModal={closeModal}
              columnDefs={columnDefs}
              runAutofix={runAutofix}
              autofixValues={autofixValues}
            />
          }

          {!downloadig ? (
            <>
              <Button
                onClick={() => onBtnExport(false)}
                type={ButtonTypes.subtle}>
                Download
              </Button>
            </>
          ) : (
            <div className="animate-bounce bg-white dark:bg-slate-800 p-2 w-10 h-10 ring-1 ring-slate-900/5 dark:ring-slate-200/20 shadow-lg rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-violet-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          )}
          <Button
            onClick={() => onBtnSubmit()}
            type={ButtonTypes.primary}
            customStyle={{ marginLeft: '10px' }}
          >
            Submit
          </Button>
        </div>

        {showResultModal && (
          <SuccessModal submit={onFinalSubmit} message={fileMetaData} />
        )}
        <HappyModal isVisible={isVisible} setIsVisible={setIsVisible} />
        <WarningModal
          isVisible={isDownloadWarningModalVisible}
          setIsVisible={setDownloadWarningModalVisible}
          submit={() => onBtnExport(true)}
          metaData={fileMetaData}
          type="Download"
        />
        <WarningModal
          isVisible={isWarningModalVisible}
          setIsVisible={setWarningModalVisible}
          submit={submitFirstModal}
          metaData={fileMetaData}
          type="Submit"
        />
      </div>
    </div>
  );
};

export default ReviewCsv;
