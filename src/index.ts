import { Counter, register, Registry } from "prom-client";
import { readFileSync } from "fs";

/**
 * Capture fields from the default package.json
 */
export interface PackageType {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  dependencies: {
    [packageName: string]: string;
  };
  devDependencies: {
    [packageName: string]: string;
  };
}

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
  registers?: Registry[];

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

function getIndividualPackageVersions(
  config: MindsEyeConfiguration,
  packageName: string
): string | undefined {
  let version = undefined;
  try {
    const path = config.nodeModulesPath
      ? `${config.nodeModulesPath}${packageName}/package.json`
      : `./node_modules/${packageName}/package.json`;

    const loadedPackageJson = JSON.parse(readFileSync(path).toString("utf-8"));
    if (loadedPackageJson.version) {
      version = loadedPackageJson.version;
    }
  } catch (err) {
    if (config.reportMissingPackageJson) {
      console.error(
        `Cannot locate package info for sub-packages ${packageName}: ${err.message}`
      );
    }
  }
  return version;
}

/**
 * Read current directory's package.json, and read its dependencies, and display them
 * in a prometheus exporter on port 9991
 *
 * Useful to put into legacy applications to have dependencies available in prometheus
 * and visualize via grafana
 *
 * @param config
 */
export function collectPackageInfo(config: MindsEyeConfiguration): boolean {
  let localRegisters = [register];
  if (config.registers) {
    localRegisters = config.registers;
  } else if (config.port) {
    // When port is specified, use a new Register
    localRegisters = [new Registry()];
  }

  const packageCounter = new Counter({
    name: `npm_packages_installed`,
    help: "npm packages installed for this project",
    labelNames: ["package_type", "package_name", "package_version"],
    registers: localRegisters
  });

  let packageJson: PackageType | undefined = undefined;
  if (config.packageJson) {
    packageJson = JSON.parse(config.packageJson);
  } else if (config.packageJsonPath) {
    packageJson = JSON.parse(
      readFileSync(config.packageJsonPath).toString("utf-8")
    );
  } else {
    packageJson = JSON.parse(readFileSync("./package.json").toString("utf-8"));
  }

  if (packageJson !== undefined) {
    for (const depPackageName in packageJson.devDependencies) {
      packageCounter.inc({
        package_type: "dev-dep",
        package_name: depPackageName,
        package_version:
          getIndividualPackageVersions(config, depPackageName) ||
          packageJson.devDependencies[depPackageName]
      });
    }

    for (const packageName in packageJson.dependencies) {
      packageCounter.inc({
        package_type: "dep",
        package_name: packageName,
        package_version:
          getIndividualPackageVersions(config, packageName) ||
          packageJson.dependencies[packageName]
      });
    }

    // Setup express.
    if (config.runExpress !== false) {
      const express = require("express")

      const metricServer = express();
      metricServer.get("/metrics", (req, res) => {
        res.send(Registry.merge(localRegisters).metrics());
      });

      metricServer.listen(config.port || 9991, () =>
        console.log(
          `MindsEye listening on port ${config.port || 9991} /metrics`
        )
      );
    }

    return true;
  }

  return false;
}
