import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-badge",
  color: {
    info: "openui-intelligent-badge--color-info",
    success: "openui-intelligent-badge--color-success",
    warning: "openui-intelligent-badge--color-warning",
    danger: "openui-intelligent-badge--color-danger",
    purple: "openui-intelligent-badge--color-purple",
    pink: "openui-intelligent-badge--color-pink",
  },
} as const;

/**
 * Tag gives the structure; the kit's pill replaces its shape, type and colours. Each tone only sets
 * the two variables the root reads. The Row rule isn't flat, because the Badge is the model's child there.
 */
export const styles = {
  root: css`
    &.openui-tag {
      display: inline-flex;
      align-self: flex-start;
      gap: 5px;
      width: fit-content;
      height: auto;
      min-height: 26px;
      padding: 3px 10px;
      border-radius: 999px;
      background: var(--_openui-intelligent-badge-fill, ${tokens.badgeNeutralSoft});
      color: var(--_openui-intelligent-badge-ink, ${tokens.ink});
      font-size: 13px;
      line-height: 18px;
      font-weight: 560;
    }
    .openui-intelligent-row > &.openui-tag {
      align-self: center;
      flex: none;
    }
  `,
  color: {
    info: css`
      --_openui-intelligent-badge-fill: ${tokens.infoSoft};
      --_openui-intelligent-badge-ink: ${tokens.info};
    `,
    success: css`
      --_openui-intelligent-badge-fill: ${tokens.badgeSuccessSoft};
      --_openui-intelligent-badge-ink: ${tokens.badgeSuccess};
    `,
    warning: css`
      --_openui-intelligent-badge-fill: ${tokens.badgeWarningSoft};
      --_openui-intelligent-badge-ink: ${tokens.badgeWarning};
    `,
    danger: css`
      --_openui-intelligent-badge-fill: ${tokens.badgeDangerSoft};
      --_openui-intelligent-badge-ink: ${tokens.badgeDanger};
    `,
    purple: css`
      --_openui-intelligent-badge-fill: ${tokens.badgePurpleSoft};
      --_openui-intelligent-badge-ink: ${tokens.badgePurple};
    `,
    pink: css`
      --_openui-intelligent-badge-fill: ${tokens.badgePinkSoft};
      --_openui-intelligent-badge-ink: ${tokens.badgePink};
    `,
  },
};
