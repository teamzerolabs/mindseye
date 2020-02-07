# mindseye

<img src="https://user-images.githubusercontent.com/7019327/74049379-d7048900-4988-11ea-9cde-af4c759a54e1.png" width="100" height="100">

MindsEye is a prometheus exporter that helps you track node packages in production.

```js
const app = express();

// Add the following:

const client = require("prom-client");
const { collectPackageInfo } = require("mindseye");

collectPackageInfo({ registers: [client.register] });
```

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 0.10 or higher is required.

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
$ npm install mindseye
```

Follow [our installing guide](http://expressjs.com/en/starter/installing.html)
for more information.

This package depends on `express` and `prom-client`

## Configuration

```typescript
export interface MindsEyeConfiguration {
    /**
     * Where package.json is located
     */
    packageJsonPath?: string;
    
    /**
     * You can also pass in the package.json buffer directly if you loaded it.
     */
    packageJson?: string;
    
    /**
     * prefix for where all the node modules are.
     * Will use `./node_modules` if unspecified
     */
    nodeModulesPath?: string;
    
    /**
     * Please pass in the register from the default import!
     */
    registers?: Registry[]; // Promethesus registry
    
    /**
     * Which port to run the exporter on, defaults to 9991
     * Metrics are available on localhost:9991/metrics
     */
    port?: number;
    
    /**
     * Logs to console.err if true
     */
    reportMissingPackageJson?: boolean;
    
    /**
     * If you are managing your own exporter, set this to false
     * By default it will run a separate express app on port 9991
     */
    runExpress?: boolean;
}
```

NOTE: You may have to tweak `packageJsonPath` and `nodeModulesPath` when building with `docker`

## Sample Output

When program starts, you will see the following:

```text
MindsEye listening on port 9991 /metrics
```

And if you navigate to `localhost:9991/metrics`, you will see:

```text

# HELP npm_packages_installed npm packages installed for this project
# TYPE npm_packages_installed counter
npm_packages_installed{package_type="dep",package_name="dotenv",package_version="8.2.0"} 1
npm_packages_installed{package_type="dep",package_name="express",package_version="4.17.1"} 1
npm_packages_installed{package_type="dep",package_name="mindseye",package_version="1.0.0"} 1
npm_packages_installed{package_type="dep",package_name="mysql2",package_version="2.1.0"} 1
npm_packages_installed{package_type="dep",package_name="sequelize",package_version="5.21.3"} 1

```

## License

  [MIT](LICENSE)
