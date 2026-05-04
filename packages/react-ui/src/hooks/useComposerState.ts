import {
  createContext,
  createElement,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";

interface ComposerStateValue {
  textContent: string;
  setTextContent: Dispatch<SetStateAction<string>>;
}

const ComposerStateContext = createContext<ComposerStateValue | null>(null);

export const ComposerStateProvider = ({ children }: PropsWithChildren) => {
  const [textContent, setTextContent] = useState("");

  const value = useMemo(
    () => ({
      textContent,
      setTextContent,
    }),
    [textContent],
  );

  return createElement(ComposerStateContext.Provider, { value }, children);
};

export const useComposerState = () => {
  const context = useContext(ComposerStateContext);
  const [localTextContent, localSetTextContent] = useState("");

  return (
    context ?? {
      textContent: localTextContent,
      setTextContent: localSetTextContent,
    }
  );
};
