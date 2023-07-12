import React from 'react';
import Button from '../efi/Button';
import { ButtonTypes } from '../efi/ButtonTypes';

export default function WarningModal({
  isVisible,
  setIsVisible,
  submit,
  metaData,
  type,
}) {
  return (
    <>
      {isVisible ? (
        <>
          <div className="absolute overflow-x-hidden z-50 outline-none focus:outline-none w-[25rem] inset-0 m-auto h-fit rounded-lg shadow-xl">
            <div>
              <div className="border-0 relative flex flex-col w-full h-full bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between p-3 mx-4 border-b border-solid border-slate-200 rounded-t">
                  <h3 className="text-sm font-semibold">
                    You have {metaData.totalRecords - metaData.validRecords}{' '}
                    rows with unresolved format issues !
                  </h3>
                </div>
                <div className="flex bg-gray-50">
                  <div className="flex flex-col mx-2 my-4 w-1/2">
                    <div className="flex h-20 text-center text-sm">
                      Review and fix format issues
                    </div>
                    <Button
                      onClick={() => setIsVisible(false)}
                      type={ButtonTypes.positive}
                    >
                      Go Back
                    </Button>
                  </div>
                  <div className="absolute left-1/2 -ml-0.5 w-0.5 h-32 mt-4 bg-gray-200"></div>
                  <div className="flex flex-col mx-2 my-4 w-1/2">
                    <div className="flex h-20 text-center text-sm">
                      Discard {metaData.totalRecords - metaData.validRecords}{' '}
                      rows with issues. {type} the rest.
                    </div>
                    <Button
                      onClick={() => submit(true)}
                      type={ButtonTypes.negative}
                    >
                      {type}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
