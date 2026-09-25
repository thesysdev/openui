# OpenUI cookbooks

Runnable examples for the [Cookbooks docs](https://www.openui.com/docs/cookbooks). Read a cookbook for the walkthrough, then run or adapt its example here.

| Cookbook                 | Example                                                           | Docs                                                                                                               |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Conversational analytics | [Next.js, OpenUI Gateway, and SQLite](./conversational-analytics) | [Explore Formula 1 lap times through conversation](https://www.openui.com/docs/cookbooks/conversational-analytics) |

## Run an example

Open its directory and follow its README for prerequisites, data preparation, credentials, and development commands. Each example is standalone and uses published OpenUI packages.

## Contribute a cookbook

- Put the example in `examples/cookbooks/<name>/` and its cookbook page in `docs/content/docs/cookbooks/<name>.mdx`.
- Link the example's README to the cookbook page and the page to the example's source.
- Register the example in `examples/examples.json`, this catalog, and the [examples catalog](../README.md).
- Follow the [example maintenance contract](../README.md#maintenance-contract), including a credential-free `verify` command.
- Update the example and its cookbook page in the same pull request.

Cookbooks use the existing `examples:install`, `examples:verify`, and `examples:update` scripts. The repository's example build and dependency-update workflows discover these examples automatically.
