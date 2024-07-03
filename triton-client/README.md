# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app),
using the [cra-template-redux-typescript template](https://github.com/reduxjs/cra-template-redux-typescript)

## Linting and Formatting

Please install the recommended ESLint extension, and ensure that the VS Code settings are enabled
for linting and for formatting on save. Linting rules are defined in the .eslintrc.json file, which
inherits the React linting rules.

## SCSS

The sass compiler was added to the project dev dependencies to allow us to import scss files
into our React components. Each component should have an accompanying scss file containing its
styles, and the scss file should be imported into the component.

Common scss variables, mixins, etc. should be put in the components/styles/scss directory.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run build-storybook`

> Storybook will create a static web application capable of being served by any web server. Once you've built your Storybook as a static web app, you can publish it to your web host.

Source: <https://storybook.js.org/docs/react/sharing/publish-storybook#build-storybook-as-a-static-web-application>

### `npm run start-storybook`

> It will start Storybook locally and output the address. Depending on your system configuration, it will automatically open the address in a new browser tab, and you'll be greeted by a welcome screen.

Source: <https://storybook.js.org/docs/react/get-started/install>

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
