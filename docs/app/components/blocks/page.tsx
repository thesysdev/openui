import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import styles from "./page.module.css";

export default function BlocksPage() {
  return (
    <PreviewPage>
      <PreviewSection title="Introduction" headingLevel="h1">
        <div className={styles.body}>
          <p>
            Blocks are the core building units of OpenUI. Think of them like LEGO pieces for
            generative interfaces: small, self-contained UI primitives that can be combined to
            create rich, structured experiences.
          </p>
          <p>
            Each block is designed to represent a specific pattern of structured data, such as
            attribute lists, callouts, tabs, tables, and more. These blocks are purpose-made
            generative UI - so they are optimized for flexibility and composability. Whether
            you&rsquo;re displaying &ldquo;Things to do in Paris&rdquo; or a complex data-rich
            interface, blocks provide a consistent, scalable foundation that keeps generated UI
            clean, predictable, and easy to evolve.
          </p>
        </div>
        <BlockVariantPreview hidePrompt />
      </PreviewSection>

      <PreviewSection title="How to compose">
        <div className={styles.body}>
          <p>Composition is how individual blocks come together to form complete interfaces.</p>
          <p>
            AI is responsible for assembling blocks based on its understanding of the content and
            context. Given structured data and intent, the model selects the blocks that best fit
            the information hierarchy and user experience. This allows interfaces to be generated
            dynamically while still maintaining strong visual and structural consistency.
          </p>
          <p>However, this behavior is not a black box, you remain in control.</p>
          <p>You can guide composition through system prompts and usage rules, for example:</p>
          <ul>
            <li>defining when a particular block should be preferred</li>
            <li>specifying which block to use for specific contexts</li>
            <li>discouraging blocks in specific contexts</li>
          </ul>
        </div>
        <BlockVariantPreview hidePrompt />
      </PreviewSection>

      <PreviewSection title="Understanding configurations">
        <div className={styles.body}>
          <p>
            Many OpenUI blocks expose configurations that control their children elements and
            appearance. These configuration surfaces allow a single block to support multiple
            variations without requiring separate components.
          </p>
          <p>
            By default, the system intelligently selects the configuration that best fits the
            generated context. This keeps outputs adaptive and reduces the need for manual tuning in
            most cases.
          </p>
          <p>
            When more control is needed, you can explicitly steer configuration selection through
            your system prompts. This approach preserves the flexibility of generative UI while
            giving you precise control where consistency or requirements demand it.
          </p>
        </div>
        <BlockVariantPreview hidePrompt />
      </PreviewSection>
    </PreviewPage>
  );
}
