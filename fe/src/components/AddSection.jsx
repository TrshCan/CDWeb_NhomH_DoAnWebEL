import React from "react";
import { PlusIcon, XIcon } from "../icons";

export default function AddSection({ onAddClick, isModalOpen }) {
  return (
    <div className="flex items-center my-2">
      <div className="flex-grow border-t-2 border-violet-400"></div>
      <button
        onClick={onAddClick}
        className="mx-4 bg-violet-600 p-2 rounded-full hover:bg-violet-700 transition-colors shadow-md"
      >
        {isModalOpen ? <XIcon /> : <PlusIcon />}
      </button>
      <div className="flex-grow border-t-2 border-violet-400"></div>
    </div>
  );
}
