import { useState } from "react";

export const useDragAndDrop = () => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  return {
    draggedIndex,
    setDraggedIndex,
    dragOverIndex,
    setDragOverIndex,
  };
};
