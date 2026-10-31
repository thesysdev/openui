"use client";

import clsx from "clsx";
import React, { createContext, useContext } from "react";
import { names, stepsStyles } from "./steps.styles";

export interface StepsItemProps {
  title: React.ReactNode;
  details: React.ReactNode;
  number?: number;
}

export interface StepsProps {
  children: React.ReactNode;
}

const StepNumberContext = createContext<number>(0);

export const Steps: React.FC<StepsProps> = ({ children }) => {
  const styles = stepsStyles;
  return (
    <div className={clsx(styles.root, names.root)}>
      <div className={clsx(styles.list, names.list)}>
        {React.Children.map(children, (child, index) => (
          <StepNumberContext.Provider value={index + 1}>{child}</StepNumberContext.Provider>
        ))}
      </div>
    </div>
  );
};

export const StepsItem: React.FC<StepsItemProps> = ({ title, details, number }) => {
  const stepNumber = useContext(StepNumberContext);

  const styles = stepsStyles;
  return (
    <div className={clsx(styles.item, names.item)}>
      <div className={clsx(styles.connector, names.connector)}>
        <div className={clsx(styles.number, names.number)}>
          <div className={clsx(styles.numberInner, names.numberInner)}>
            {Number.isInteger(number) ? number : stepNumber}
          </div>
        </div>
        <div className={clsx(styles.connectorLine, names.connectorLine)} />
      </div>
      <div className={clsx(styles.content, names.content)}>
        <span className={clsx(styles.title, names.title)}>{title}</span>
        <div className={clsx(styles.details, names.details)}>{details}</div>
      </div>
    </div>
  );
};
