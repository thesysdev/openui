import type { StackChipItem } from "../../components/StackChip/StackChip";
import styles from "./CompatibilityDiagram.module.css";
import { StackCentreColumn } from "./StackCentreColumn";
import { StackLayerRow } from "./StackLayerRow";

type StackGroup = { label: string; items: StackChipItem[] };

/* Four rows of square cells, one per layer, their bands drifting inward in step
 * so the rows read as one grid rather than four strips. The centre of the grid
 * is a single column, drawn over all four rows, naming each layer.
 */
export function CompatibilityDiagram({ groups }: { groups: StackGroup[] }) {
  return (
    <div className={styles.diagram}>
      <div className={styles.rows}>
        {groups.map((group, index) => (
          <StackLayerRow items={group.items} key={group.label} rowIndex={index} />
        ))}
        <StackCentreColumn layers={groups} />
      </div>

      <div className={styles.readerOnly}>
        {groups.map((group) => (
          <section key={group.label}>
            <h3>{group.label}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.name}>{item.name}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
