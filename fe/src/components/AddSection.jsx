import React from "react";
import { PlusIcon, XIcon } from "../icons";

export default function AddSection({ onAddClick, isModalOpen }) {
  return (
    <div className="flex items-center my-2">
      <div className="flex-grow border-t border-violet-600"></div>
      <button
        onClick={onAddClick}
        className="mx-4 bg-violet-600 p-2 rounded hover:bg-violet-700 transition-colors shadow-md flex items-center justify-center"
        style={{ width: '32px', height: '32px' }}
      >
        {isModalOpen ? (
          <XIcon className="text-white" />
        ) : (
          <PlusIcon className="text-white" />
        )}
      </button>
      <div className="flex-grow border-t border-violet-600"></div>
    </div>
  );
}
