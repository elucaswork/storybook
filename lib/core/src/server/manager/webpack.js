import webpack from 'webpack';
import loadConfig from '../config';

const configDir = process.argv.reduce(
  (acc, i) => (i.includes('configDir=') ? i.replace('configDir=', '') : acc),
  './.storybook'
);

const managerConfig = loadConfig({
  configType: 'DEVELOPMENT',
  corePresets: [require.resolve('../core-preset-manager.js')],
  configDir,
});

const managerCompiler = webpack(managerConfig);

managerCompiler.run((err, stats) => {
  if (err || stats.hasErrors()) {
    // TODO: propagate the right error
    console.log(JSON.stringify(stats.toJson()));
  }
});
