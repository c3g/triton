# Contributing

## Dev Environment

Please install the workspace recommended extensions - mainly ESLint and Prettier.

This project uses eslint configured with [standard-with-typescript](https://github.com/standard/eslint-config-standard-with-typescript), which is a standard linter
configuration, based on [standardjs](https://standardjs.com).

We use prettier to format the source code, rather than eslint. If you use a linter for code formatting then
you end up with red squigglies all over the place related to code formatting, rather than code errors,
which makes coding unpleasant.

The project workspace settings are set up to format the code on save. Prettier will format the code
every time you save your work. It's important that code format-on-save is used by everyone, to avoid
having PR's full of diffs caused by unformatted code.
