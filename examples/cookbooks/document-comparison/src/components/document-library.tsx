"use client";

import { useNav } from "@openuidev/react-ui";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";

type LibraryDocument = {
  id: string;
  name: string;
  period: string | null;
  pages: number;
  passages: number;
  url: string | null;
};

// The Documents page: what the assistant compares, with a link to each source PDF.
export function DocumentLibrary() {
  const { navigate } = useNav();
  const [documents, setDocuments] = useState<LibraryDocument[]>();
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/documents")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setDocuments(body.documents);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <div className="library">
      <button type="button" className="library-back" onClick={() => navigate(undefined)}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to chat
      </button>
      <h1>Document library</h1>
      <p className="library-intro">
        The annual reports this assistant compares. Every answer cites pages from these files.
      </p>
      {error && <p role="alert">{error}</p>}
      <ul className="library-list">
        {documents?.map((document) => (
          <li key={document.id} className="library-card">
            <span className="library-icon">
              <FileText size={20} aria-hidden="true" />
            </span>
            <div>
              <h2>{document.name}</h2>
              {document.period && <p>{document.period}</p>}
              <p>
                {document.pages} pages · {document.passages} searchable passages
              </p>
            </div>
            {document.url && (
              <a href={document.url} target="_blank" rel="noreferrer" className="library-link">
                Source PDF
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="library-note">
        To compare your own PDFs, add them to <code>documents/</code> and run{" "}
        <code>npm run prepare:documents</code>.
      </p>
    </div>
  );
}
