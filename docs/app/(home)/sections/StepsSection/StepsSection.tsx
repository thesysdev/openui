"use client";

import { ExpandChevron } from "../../components/ExpandChevron";
import { useSingleOpenAccordion } from "../../components/MobileAccordion/useSingleOpenAccordion";
import styles from "./StepsSection.module.css";

const STEPS = [
  {
    title: (
      <>
        You define <br className={styles.titleBreak} />
        your library
      </>
    ),
    description: (
      <>
        Register components with <code className={styles.code}>defineComponent</code> &{" "}
        <code className={styles.code}>createLibrary</code>.
      </>
    ),
  },
  {
    title: (
      <>
        OpenUI generates <br className={styles.titleBreak} />
        system prompt
      </>
    ),
    description: "Generate a system prompt from your library and send it to LLM.",
  },
  {
    title: (
      <>
        LLM responds <br className={styles.titleBreak} />
        in OpenUI Lang
      </>
    ),
    description: "The model returns token-efficient, line-oriented OpenUI Lang.",
  },
  {
    title: (
      <>
        Renderer parses <br className={styles.titleBreak} />
        and renders UI
      </>
    ),
    description: "The renderer parses the output and renders UI in real time.",
  },
];

export function StepsSection() {
  // Mobile-only: all steps collapsed by default; one expands at a time and the
  // open one can be tapped to collapse.
  const accordion = useSingleOpenAccordion();

  return (
    <section className={styles.section}>
      <ol className={styles.container}>
        {STEPS.map((step, index) => (
          <li className={styles.step} key={index} {...accordion.getToggleProps(index)}>
            <span className={styles.badge}>{index + 1}</span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <ExpandChevron className={styles.chevron} />
            <p className={styles.stepDescription}>
              <span className={styles.stepDescriptionInner}>{step.description}</span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
