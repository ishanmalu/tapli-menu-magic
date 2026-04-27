import { useState, useCallback } from "react";

/**
 * Generic undo/redo hook. All state history is local — nothing hits the DB
 * until the parent component explicitly saves.
 */
export function useUndoable<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const [undoStack, setUndoStack] = useState<T[]>([]);
  const [redoStack, setRedoStack] = useState<T[]>([]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const nextVal = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        setUndoStack((u) => [...u.slice(-29), prev]);
        setRedoStack([]);
        return nextVal;
      });
    },
    []
  );

  const undo = useCallback(() => {
    setUndoStack((u) => {
      if (u.length === 0) return u;
      const prev = u[u.length - 1];
      setState((cur) => {
        setRedoStack((r) => [...r, cur]);
        return prev;
      });
      return u.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[r.length - 1];
      setState((cur) => {
        setUndoStack((u) => [...u, cur]);
        return next;
      });
      return r.slice(0, -1);
    });
  }, []);

  /** Hard-reset to a new initial value (call when restaurant.id changes). */
  const reset = useCallback((next: T) => {
    setState(next);
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    state,
    update,
    undo,
    redo,
    reset,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
