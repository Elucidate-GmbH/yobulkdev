import { Dialog, RadioGroup, Transition } from '@headlessui/react';
import { Fragment, useState, useContext, useEffect } from 'react';
import ValidationModel from './ValidationModel';
import InputField from './InputField';
import { Context } from '../../../context';
import { XMarkIcon } from '@heroicons/react/24/outline';
import cuid from 'cuid';
import Select from 'react-tailwindcss-select';
import Link from 'next/link';
import { InformationCircleIcon } from '@heroicons/react/24/solid';

const MainModel = ({ isOpen, closeModal, setTemplateData }) => {
  let [isOpenValidation, setIsOpenValidation] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const { state, dispatch } = useContext(Context);
  const [prompt, setPrompt] = useState('');
  const [regexModal, setRegexModal] = useState(false);
  const [isCustomRegex, setIsCustomRegex] = useState(false);
  const [selectedOption, setSelectedOption] = useState(false);
  const [requiredError, setRequiredError] = useState(false);

  const [regex, setRegex] = useState('');

  useEffect(() => {
    if (state.isTemplateEditing) {
      setModalData(
        Object.keys(state.templateColumnToEdit).map((el) => {
          return { key: el, value: state.templateColumnToEdit[el] };
        })
      );
    }
  }, [state.templateColumnToEdit]);

  function closeSubModel() {
    setIsOpenValidation(false);
  }

  function openSubModal() {
    setRequiredError(false);
    setIsOpenValidation(true);
  }

  function openRegexModal() {
    setRegexModal(true);
  }

  function closeRegexModal() {
    setSelectedOption({ value: 'custom', label: 'Enter Custom Regex' })
    setRegex('')
    setRegexModal(false);
  }

  const handleCloseMainModal = (e) => {
    setModalData([]);
    closeModal(e);
  };

  const handleSaveMainModalData = (e) => {
    let requiredValues = modalData.filter(
      (e) => e.key === 'label' || e.key === 'data_type'
    );
    if (requiredValues.length < 2) {
      setRequiredError(true);
      return;
    }

    setTemplateData((prev) => {
      let colObj = {};
      colObj['is_required'] = enabled;

      modalData.map((el) => {
        colObj[el.key] = el.value;
      });
      if (!colObj['key']) {
        colObj['key'] = cuid();
      }

      if (!prev.columns) {
        return { ...prev, columns: [{ ...colObj }] };
      }

      if (prev.columns.find((el) => el.key === colObj.key)) {
        return {
          ...prev,
          columns: prev.columns.map((obj) =>
            obj.key === colObj.key ? colObj : obj
          ),
        };
      } else if (
        prev.columns.find(
          (el) => el.label.toUpperCase() === colObj.label.toUpperCase()
        )
      ) {
        return {
          ...prev,
          columns: prev.columns.map((obj) =>
            obj.label.toUpperCase() === colObj.label.toUpperCase()
              ? colObj
              : obj
          ),
        };
      } else {
        return { ...prev, columns: [...prev.columns, colObj] };
      }
    });
    handleCloseMainModal(e);
    if (state.isTemplateEditing) {
      dispatch({ type: 'SET_CUR_TEMPLATE_EDIT', payload: false });
    }
  };

  const handleBlur = ({ key, value }) => {
    setModalData((prev) => {
      if (prev.find((el) => el.key === key)) {
        return prev.map((obj) => (obj.key === key ? { key, value } : obj));
      } else {
        return [...prev, { key, value }];
      }
    });
  };

  const handleRequired = () => {
    setModalData((prev) => {
      if (prev.find((el) => el.key === 'is_required')) {
        return prev.map((obj) =>
          obj.key === 'is_required'
            ? { key: 'is_required', value: !enabled }
            : obj
        );
      } else {
        return [...prev, { key: 'is_required', value: !enabled }];
      }
    });

    setEnabled(!enabled);
  };

  const generateRegex = () => {
    setRegex('Generating...');
    fetch('/api/yobulk-ai/regex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        handleBlur({ key: 'pattern', value: data.data });
        setRegex(data.data);
      })
      .catch((e) => console.log(e));
  };

  const handleRegexSelect = (e) => {
    setSelectedOption(e);
    if (e.value === 'custom') {
      setRegex('');
      handleBlur({ key: 'pattern', value: undefined });
      setIsCustomRegex(true);
    } else {
      setIsCustomRegex(false);
      handleBlur({ key: 'pattern', value: e.value });
      setRegex(e.value);
    }
  };

  const regexOptions = [
    { value: 'custom', label: 'Enter Custom Regex' },
    { value: '^\\d{5}(?:[-\\s]\\d{4})?$', label: 'US Zip Code' },
    { value: '^\\+?[1-9][0-9]{7,14}$', label: 'US Phone Number' },
    {
      value: '/^4([0-9]{3})\\s?([0-9]{4})\\s?([0-9]{4})\\s?([0-9]{4})$/',
      label: 'Card (MasterCard)',
    },
    {
      value:
        '/^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/',
      label: 'Ip Address',
    },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleCloseMainModal}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-md bg-white p-4 text-left align-middle shadow-xl transition-all dark:bg-gray-900">
                <Dialog.Title
                  as="h2"
                  className="text-lg flex items-center font-medium leading-6 text-gray-900 dark:text-white"
                >
                  Add Column{' '}
                  <button
                    type="button"
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    data-modal-toggle="defaultModal"
                    onClick={handleCloseMainModal}
                  >
                    <XMarkIcon className="h-6" />
                    <span className="sr-only">Close modal</span>
                  </button>
                </Dialog.Title>
                <div>
                  <div className="mt-2 p-2">
                    <InputField
                      name="Name"
                      colKey="label"
                      desc="Input the column name exactly as in your CSV or Excel file."
                      setModalData={setModalData}
                      columnData={'label'}
                      required
                      clearRequired={setRequiredError}
                    />

                    <InputField
                      name="Example"
                      colKey="example"
                      desc="Enter the example of the data like 'John Doe' or 123456 "
                      setModalData={setModalData} // setModalData was saving exmaple as column name in template -> fix this
                      columnData={'example'}
                      clearRequired={setRequiredError}
                    />

                    <div className="flex py-4">
                      <label className="inline-flex relative items-center mr-5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={enabled}
                          readOnly
                        />
                        <div
                          onClick={handleRequired}
                          className="w-11 h-6 bg-gray-200 rounded-full peer  peer-focus:ring-blue-400  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"
                        ></div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          Is Required
                        </span>
                      </label>
                    </div>

                    <div className="pb-4">
                      <label
                        htmlFor="default-input"
                        className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-300 required flex justify-between"
                      >
                        <span>
                          Column Format{' '}
                          <span className="text-base font-semibold text-red-500">
                            *
                          </span>
                        </span>{' '}
                        {!modalData.find((el) => el.key === 'data_type') && (
                          <span className="text-sm text-red-400 mt-1">
                            <InformationCircleIcon className="w-3 inline mb-1 mr-1" />
                            This field is required
                          </span>
                        )}
                      </label>{' '}
                      <div
                        className={`border border-gray-300 bg-gray-50 rounded-lg py-1 px-4 flex items-center justify-between pr-4 h-18 ${
                          !modalData.find((el) => el.key === 'data_type') &&
                          'border-red-400'
                        }`}
                      >
                        <div className="flex">
                          <p className="flex text-blue-400 dark:text-black">
                            {modalData.find((el) => el.key === 'data_type')
                              ? modalData.find((el) => el.key === 'data_type')
                                  .value
                              : 'Select data type ...'}
                          </p>

                          <p className="flex flex-nowrap text-gray-500 ml-5">
                            {modalData.find(
                              (el) => el.key === 'custom_validation'
                            )
                              ? modalData.find(
                                  (el) => el.key === 'custom_validation'
                                ).value
                              : ''}
                          </p>
                        </div>
                        <div className="right">
                          <button
                            type="button"
                            onClick={openSubModal}
                            className="rounded-md bg-gray-50 px-4 py-2 text-sm font-medium text-[#2c71b2] items-center dark:text-black"
                          >
                            Change
                          </button>
                          <ValidationModel
                            isOpen={isOpenValidation}
                            closeModal={closeSubModel}
                            setModalData={setModalData}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={openRegexModal}
                        className="rounded-md w-full border bg-white px-4 py-2 text-sm font-medium text-[#2c71b2] items-center dark:bg-gray-800 dark:text-white"
                      >
                        Add Regex
                      </button>

                      <Transition appear show={regexModal} as={Fragment}>
                        <Dialog
                          as="div"
                          className="relative z-10"
                          onClose={closeRegexModal}
                        >
                          <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                          </Transition.Child>

                          <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-fit my-16 justify-center p-4 text-center">
                              <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                              >
                                <Dialog.Panel className="w-full max-w-md transform  rounded-md bg-white p-6 text-left align-middle transition-all">
                                  <Dialog.Title
                                    as="h2"
                                    className="text-lg flex items-center font-medium leading-6 text-gray-900 mb-6"
                                  >
                                    Add Regex
                                    <button
                                      type="button"
                                      className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                      data-modal-toggle="defaultModal"
                                      onClick={closeRegexModal}
                                    >
                                      <XMarkIcon className="h-6" />
                                      <span className="sr-only">
                                        Close modal
                                      </span>
                                    </button>
                                  </Dialog.Title>
                                  {isCustomRegex && (
                                    <>
                                      <textarea
                                        className="w-full mt-2 rounded-md text-xs"
                                        placeholder="Enter regex"
                                        value={regex}
                                        onChange={(e) => {
                                          handleBlur({
                                            key: 'pattern',
                                            value: e.target.value,
                                          });
                                          setRegex(e.target.value);
                                        }}
                                      />
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    className="flex mt-4 w-full bg-white border-2 border-blue-500 text-blue-500 hover:text-white hover:bg-blue-500 focus:outline-none font-medium rounded-md gap-1 text-sm px-6 py-2 text-center justify-center mb-2"
                                    onClick={closeRegexModal}
                                  >
                                    DONE
                                  </button>
                                </Dialog.Panel>
                              </Transition.Child>
                            </div>
                          </div>
                        </Dialog>
                      </Transition>
                    </div>

                    <InputField
                      name="Custom Validation Error Message"
                      colKey="custom_message"
                      desc="Custom error to show when column doesn't meet the validation format."
                      setModalData={setModalData}
                      columnData={'custom_message'}
                      clearRequired={setRequiredError}
                    />
                    {requiredError && (
                      <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-1 relative"
                        role="alert"
                      >
                        * Please fill all the required fields
                      </div>
                    )}
                    <div className="mt-4 float-right">
                      <button
                        type="button"
                        className="flex bg-white border-2 mt-1 border-blue-500 text-blue-500 hover:text-white hover:bg-blue-500 focus:outline-none font-medium rounded-md gap-1 text-sm px-6 py-1 text-center mb-2"
                        onClick={handleSaveMainModalData}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MainModel;
