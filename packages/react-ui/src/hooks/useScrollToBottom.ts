"use client";

import { RefObject, useCallback, useEffect, useRef } from "react";

export type ScrollVariant = "always" | "once" | "user-message-anchor";
export const useScrollToBottom = <T extends HTMLElement | null, L extends { id: string }>({
  ref,
  lastMessage,
  scrollVariant,
  userMessageSelector = ".openui-shell-thread-message-user",
  isRunning,
  isLoadingMessages,
}: {
  ref: RefObject<T>;
  // scroll to bottom when this value changes
  lastMessage: L;
  scrollVariant: ScrollVariant;
  userMessageSelector?: string;
  // if true, scroll to bottom logic will work
  isRunning?: boolean;
  isLoadingMessages?: boolean;
}) => {
  const previousLastMessage = useRef<L | null>(null);
  const lastUserMessage = useRef<HTMLElement | null>(null);
  const hasUserScrolledWhenIsRunning = useRef(false);
  const wasScrolledToBottomAfterLoading = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!isRunning || !element) {
      hasUserScrolledWhenIsRunning.current = false;
      return;
    }
    let isUserScrolling = false;

    const userScrollingDisabler = () => {
      isUserScrolling = false;
    };

    const userScrollingEnabler = () => {
      isUserScrolling = true;
    };

    const scrollListener = () => {
      if (!isUserScrolling) {
        return;
      }
      hasUserScrolledWhenIsRunning.current = true;
      removeListeners();
    };

    const addListeners = () => {
      element.addEventListener("scroll", scrollListener);
      element.addEventListener("click", userScrollingDisabler);
      element.addEventListener("touchmove", userScrollingEnabler);
      element.addEventListener("wheel", userScrollingEnabler);
      element.addEventListener("keydown", userScrollingEnabler);
      element.addEventListener("mousedown", userScrollingEnabler);
    };

    const removeListeners = () => {
      element.removeEventListener("scroll", scrollListener);
      element.removeEventListener("click", userScrollingDisabler);
      element.removeEventListener("touchmove", userScrollingEnabler);
      element.removeEventListener("wheel", userScrollingEnabler);
      element.removeEventListener("keydown", userScrollingEnabler);
      element.removeEventListener("mousedown", userScrollingEnabler);
    };

    addListeners();

    return () => {
      removeListeners();
    };
  }, [isRunning]);

  const scrollToBottom = useCallback(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    if (scrollVariant === "always") {
      if (previousLastMessage.current !== lastMessage) {
        const scrollBy = element.scrollHeight - element.scrollTop - element.clientHeight;
        if (scrollBy > 90) {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: "smooth",
          });
        } else {
          element.scrollTop = element.scrollHeight;
        }
      }
    } else if (scrollVariant === "once") {
      if (previousLastMessage.current?.id !== lastMessage.id) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: "smooth",
        });
      }
    } else {
      const lastUserMessageDiv = Array.from(element.querySelectorAll(userMessageSelector)).pop() as
        | HTMLElement
        | undefined;
      const lastUserMessageNextSibling = lastUserMessageDiv?.nextElementSibling;
      if (
        lastUserMessageDiv &&
        (!lastUserMessageNextSibling?.nextElementSibling ||
          !wasScrolledToBottomAfterLoading.current) &&
        previousLastMessage.current?.id !== lastMessage.id
      ) {
        const scrollPaddingTop =
          Number.parseFloat(window.getComputedStyle(element).scrollPaddingTop || "0") || 0;

        // scroll to last user message till there is only 1 more message
        const scrollPosition =
          lastUserMessageDiv.getBoundingClientRect().top -
          element.getBoundingClientRect().top +
          element.scrollTop -
          scrollPaddingTop;

        element.scrollTo({ top: Math.max(scrollPosition, 0), behavior: "smooth" });
        lastUserMessage.current = lastUserMessageDiv;
      }
    }

    previousLastMessage.current = lastMessage;
  }, [ref, lastMessage, scrollVariant, userMessageSelector]);

  useEffect(() => {
    if (
      (isRunning && !hasUserScrolledWhenIsRunning.current) || // scroll to bottom if user hasn't scrolled when isRunning is true
      (!wasScrolledToBottomAfterLoading.current && !isLoadingMessages) // scroll to bottom once when messages are loaded
    ) {
      scrollToBottom();
      wasScrolledToBottomAfterLoading.current = true;
    }

    if (isLoadingMessages) {
      wasScrolledToBottomAfterLoading.current = false;
    }
  }, [scrollToBottom, isRunning, isLoadingMessages]);
};
