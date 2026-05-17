import { useEffect, useId, useRef, useState } from "react";
import type { UserSearchResult } from "@team-task-manager/shared";
import { searchUsers } from "../../api/users";
import { ApiError } from "../../api/client";
import { Spinner } from "../ui/Spinner";

type UserSearchSelectProps = {
  projectId: string;
  onSelect: (user: UserSearchResult) => void;
  disabled?: boolean;
};

export function UserSearchSelect({
  projectId,
  onSelect,
  disabled,
}: UserSearchSelectProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      searchUsers(query.trim(), projectId)
        .then((data) => {
          setResults(data.users);
          setOpen(true);
        })
        .catch((err) => {
          setResults([]);
          setError(
            err instanceof ApiError ? err.message : "Search failed",
          );
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, projectId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handlePick(user: UserSearchResult) {
    onSelect(user);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={listId} className="sr-only">
        Search registered users
      </label>
      <input
        id={listId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        disabled={disabled}
        placeholder="Search by name or email…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-60"
        autoComplete="off"
      />
      {loading ? (
        <span className="absolute right-3 top-2.5">
          <Spinner className="h-4 w-4 text-slate-400" />
        </span>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          Type at least 2 characters to find registered users.
        </p>
      )}
      {open && results.length > 0 ? (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {results.map((user) => (
            <li key={user.id} role="option">
              <button
                type="button"
                onClick={() => handlePick(user)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">{user.name}</span>
                <span className="block text-xs text-slate-500">{user.email}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && !loading && query.trim().length >= 2 && results.length === 0 ? (
        <p className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
          No matching users found.
        </p>
      ) : null}
    </div>
  );
}
