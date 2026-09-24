# OpenUI cookbooks

Complete, runnable workflows paired with the [Cookbooks docs](https://www.openui.com/docs/cookbooks). Read the tutorial for the walkthrough, then run or adapt its companion app here.

| Cookbook                 | Runnable app                                                    | Tutorial                                                                                                           |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Conversational analytics | [Next.js, OpenUI Cloud, and SQLite](./conversational-analytics) | [Explore Formula 1 lap times through conversation](https://www.openui.com/docs/cookbooks/conversational-analytics) |

## Run a cookbook

Open its directory and follow its README for prerequisites, data preparation, credentials, and development commands. Each app is standalone and uses published OpenUI packages.

## Contribute a cookbook

- Put the runnable app in `examples/cookbooks/<name>/` and its tutorial in `docs/content/docs/cookbooks/<name>.mdx`.
- Link the app README to the tutorial and the tutorial to the app's source.
- Register the app in `examples/examples.json`, this catalog, and the [examples catalog](../README.md).
- Follow the [example maintenance contract](../README.md#maintenance-contract), including a credential-free `verify` command.
- Update the code and tutorial in the same pull request.

Cookbooks use the existing `examples:install`, `examples:verify`, and `examples:update` scripts. The repository's example build and dependency-update workflows discover their applications automatically.
