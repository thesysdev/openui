import { ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";

import { ArrowUpOutline, EllipsisOutline } from "@ant-design/icons-angular/icons";
import { en_US, provideNzI18n } from "ng-zorro-antd/i18n";
import { provideNzIcons } from "ng-zorro-antd/icon";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideNzI18n(en_US),
    provideNzIcons([ArrowUpOutline, EllipsisOutline]),
  ],
};
