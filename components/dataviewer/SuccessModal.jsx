import React, { useEffect, useState } from 'react';
import Button from '../efi/Button';
import { ButtonTypes } from '../efi/ButtonTypes';

export default function SuccessModal({ submit, message }) {
  const [isloading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval =
      message.validRecords < 5000
        ? 1
        : Math.round(message.validRecords / 10000); // reduced interval for large files
    const intervalId = setInterval(() => {
      setProgress((prev) => {
        if (prev >= Number(message.validRecords)) {
          clearInterval(intervalId);
          setLoading(false);
          return Number(message.validRecords);
        } else {
          return prev + interval;
        }
      });
    }, 1);
    return () => clearInterval(intervalId);
  }, [message.validRecords]);

  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-96 h-100-px my-6 mx-auto">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full h-full bg-white outline-none focus:outline-none">
            {isloading ? (
              <div className="grid h-20 place-content-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="h-6 w-6 block rounded-full border-4 border-t-blue-300 animate-spin"></span>
                  Imported {progress} out of {message.validRecords} rows
                </div>
              </div>
            ) : (
              <div className="flex flex-col p-5">
                <div className="flex flex-col gap-2 items-center h-50 justify-center text-lg text-blue-700">
                  <div className="text-sm font-normal leading-tight text-gray-800 mb-10">
                    You have successfully imported the records
                  </div>
                  <div className="flex gap-10 justify-center mb-10">
                    <h6 className="text-base flex flex-col gap-3 items-center justify-center font-medium leading-tight text-gray-800">
                      Submitted
                      <span className="inline-block py-1.5 px-2.5 leading-none text-center whitespace-nowrap align-baseline font-bold bg-white-300 text-blue rounded">
                        {message.totalRecords}
                      </span>
                    </h6>
                    <h6 className="text-base flex flex-col gap-3 items-center justify-center font-medium leading-tight text-gray-800">
                      Accepted
                      <span className="inline-block py-1.5 px-2.5 leading-none text-center whitespace-nowrap align-baseline font-bold bg-blue-500 text-white rounded">
                        {message.validRecords}
                      </span>
                    </h6>
                    <h6 className="text-base flex flex-col gap-3 items-center justify-center font-medium leading-tight text-gray-800">
                      Rejected
                      <span className="inline-block py-1.5 px-2.5 leading-none text-center whitespace-nowrap align-baseline font-bold bg-red-500 text-white rounded">
                        {message.totalRecords - message.validRecords}
                      </span>
                    </h6>
                  </div>
                </div>
                <Button
                  onClick={submit}
                  type={ButtonTypes.subtle}>
                  Close importer
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
