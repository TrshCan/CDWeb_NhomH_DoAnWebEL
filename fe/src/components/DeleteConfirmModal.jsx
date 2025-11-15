import React from "react";

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title = "Xác nhận xoá", message = "Bạn không thể hoàn tác thao tác này!" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/5 transition-opacity"
        onClick={onClose}
      />

      {/* Container */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Panel */}
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-sm">
          {/* Content */}
          <div className="bg-white px-6 pt-6 pb-4">
            {/* Icon Warning */}
            <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-50 mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
                className="size-6 text-red-600"
              >
                <path
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Text Content */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 flex flex-row-reverse space-x-3 space-x-reverse">
            {/* Confirm Button */}
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="inline-flex flex-1 justify-center rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-md hover:bg-purple-700 transition duration-150 ease-in-out"
            >
              Vâng, xoá
            </button>
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition duration-150 ease-in-out"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

