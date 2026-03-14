import { WelcomeMessageConfig } from "../types";

/**
 * Type guard to check if a WelcomeMessageConfig is a custom React component.
 *
 * Use this to differentiate between a custom component and a props-based
 * configuration when rendering the welcome message.
 *
 * @param config - The welcome message configuration to check
 * @returns `true` if config is a React component, `false` if it's a props object
 *
 * @example
 * if (isWelcomeComponent(welcomeMessage)) {
 *   // welcomeMessage is a React.ComponentType
 *   const CustomWelcome = welcomeMessage;
 *   return <CustomWelcome />;
 * } else {
 *   // welcomeMessage is { title?, description?, image? }
 *   return <WelcomeScreen {...welcomeMessage} />;
 * }
 */
export const isWelcomeComponent = (
  config: WelcomeMessageConfig,
): config is React.ComponentType<any> => {
  return typeof config === "function";
};

export { isChatEmpty } from "../../_shared/utils";
