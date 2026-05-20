import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, location: string) => void;
}

export function NewProjectModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setLocation("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onCreate(name.trim() || "New project", location);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-text/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md panel"
          >
            <div className="panel-header">
              <div>
                <h2 className="panel-title">New project</h2>
                <p className="panel-subtitle">Start a fresh impact analysis</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-muted hover:text-text p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4">
              <div>
                <label className="label-base">Project name</label>
                <input
                  ref={inputRef}
                  className="input-base"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Riverside Office Tower"
                  required
                />
              </div>
              <div>
                <label className="label-base">Location</label>
                <input
                  className="input-base"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create project
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
