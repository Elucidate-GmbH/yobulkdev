import React from 'react';
import Button from '../efi/Button';
import { ButtonTypes } from '../efi/ButtonTypes';
export default function SuccessModal({ isVisible, setIsVisible }) {
  return (
    <>
      {isVisible && (
        <div className="justify-center items-center flex overflow-x-hidden fixed inset-0 z-50 outline-none focus:outline-none">
          <div className="relative w-96 h-100-px my-6 mx-auto">
            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full h-full bg-white outline-none focus:outline-none">
              <div className="flex flex-col p-5">
                <div className="flex flex-col gap-2 items-center h-50 justify-center text-lg text-blue-700">
                  <p className="text-sm text-center font-normal leading-tight text-gray-900 mb-10">
                    There are no errors in the file. You can proceed to submit it.
                  </p>
                </div>
                <Button
                  onClick={() => setIsVisible(false)}
                  type={ButtonTypes.subtle}>
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
