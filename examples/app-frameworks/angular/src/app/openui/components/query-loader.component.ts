import { Component } from "@angular/core";

@Component({
  selector: "demo-query-loader",
  standalone: true,
  template: `
    <div class="loader-shell">
      <div class="spinner" aria-hidden="true"></div>
      <span>Loading query…</span>
    </div>
  `,
  styles: [
    `
      .loader-shell {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.55rem 0.8rem;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.84);
        border: 1px solid rgba(148, 163, 184, 0.32);
        color: #e2e8f0;
        box-shadow: 0 10px 30px rgba(2, 6, 23, 0.25);
      }

      .spinner {
        width: 0.85rem;
        height: 0.85rem;
        border-radius: 999px;
        border: 2px solid rgba(148, 163, 184, 0.35);
        border-top-color: #38bdf8;
        animation: spin 0.7s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class QueryLoaderComponent {}
