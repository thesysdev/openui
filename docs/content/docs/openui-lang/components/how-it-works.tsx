"use client";
import { CodeBlock } from "@/components/overview-components/code-block";
import { InlineButton } from "@/components/overview-components/inline-button";
import { SimpleCard } from "@/components/overview-components/simple-card";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

const steps = [
  {
    title: "Define Library",
    description: "Create your component library with Zod schemas and generate the system prompt",
    code: `import { defineComponent, createLibrary } from '@openuidev/react-lang';
import { z } from 'zod';

const Card = defineComponent({
  name: 'Card',
  description: 'Displays a titled content card.',
  props: z.object({
    title: z.string(),
  }),
  component: ({ props }) => <div>{props.title}</div>,
});

export const library = createLibrary({
  components: [Card, ...otherComponents],
});

export const systemPrompt = library.prompt(); // Generated system prompt
`,
  },
  {
    title: "LLM Generates OpenUI Syntax",
    description: "LLM outputs token-efficient, line-oriented syntax",
    code: `root = Stack([welcomeCard])
welcomeCard = Card([welcomeHeader, welcomeBody], "card")
welcomeHeader = CardHeader("Welcome", "Get started with our platform")
welcomeBody = Stack([signupForm], "column", "m")
signupForm = Form("signup", [nameField, emailField], actions)
nameField = FormControl("Name", Input("name", "Your name", "text", ["required", "minLength:2"]))
emailField = FormControl("Email", Input("email", "you@example.com", "email", ["required", "email"]))
actions = Buttons([signUpBtn, learnMoreBtn], "row")
signUpBtn = Button("Sign up", "submit:signup", "primary")
learnMoreBtn = Button("Learn more", "action:learn_more", "secondary")
`,
  },
];

export const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <div className="mb-12 sm:mb-20">
      <p className="mb-6 text-sm text-slate-600 sm:mb-8 sm:text-base dark:text-slate-400">
        Click through each step to see the complete workflow
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => setActiveStep(index)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeStep === index
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {index + 1}. {step.title}
          </button>
        ))}
      </div>

      <SimpleCard className="p-4 sm:p-6">
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-fd-muted dark:bg-fd-muted">
              <span className="text-sm font-semibold text-fd-foreground">{activeStep + 1}</span>
            </div>
            <div>
              <h3 className="text-base font-semibold sm:text-lg">{steps[activeStep].title}</h3>
              <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                {steps[activeStep].description}
              </p>
            </div>
          </div>
        </div>

        <CodeBlock code={steps[activeStep].code} />

        <div className="mt-4 flex justify-between">
          <InlineButton
            variant="outline"
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
          >
            Previous
          </InlineButton>
          <InlineButton
            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
            disabled={activeStep === steps.length - 1}
          >
            Next Step <ArrowRight className="ml-2 size-3" />
          </InlineButton>
        </div>
      </SimpleCard>
    </div>
  );
};
