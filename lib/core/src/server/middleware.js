import path from 'path';
import { Router } from 'express';
import webpack from 'webpack';
import spawn from 'spawn-promise';
import { logger } from '@storybook/node-logger';

import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import { getMiddleware } from './utils';
import loadConfig from './config';

let webpackResolve = () => {};
let webpackReject = () => {};

export const webpackValid = new Promise((resolve, reject) => {
  webpackResolve = resolve;
  webpackReject = reject;
});

export default async function(options) {
  const { configDir } = options;

  const [iframeConfig] = await Promise.all([
    loadConfig({
      configType: 'DEVELOPMENT',
      corePresets: [require.resolve('./core-preset-dev.js')],
      ...options,
    }),
  ]);

  const middlewareFn = getMiddleware(configDir);

  // remove the leading '/'
  let { publicPath } = iframeConfig.output;
  if (publicPath[0] === '/') {
    publicPath = publicPath.slice(1);
  }

  const managerStartTime = process.hrtime();
  const managerPromise = spawn('node', [
    path.join(__dirname, 'manager/webpack.js'),
    `configDir=${configDir}`,
  ])
    .then(a => {
      const managerTotalTime = process.hrtime(managerStartTime);
      logger.trace({ message: 'manager built', time: managerTotalTime });
      return a;
    })
    .then(b => b.toString());

  const iframeStartTime = process.hrtime();
  const iframeCompiler = webpack(iframeConfig);
  const devMiddlewareOptions = {
    noInfo: true,
    publicPath: iframeConfig.output.publicPath,
    watchOptions: iframeConfig.watchOptions || {},
    ...iframeConfig.devServer,
  };

  const router = new Router();
  const webpackDevMiddlewareInstance = webpackDevMiddleware(iframeCompiler, devMiddlewareOptions);
  router.use(webpackDevMiddlewareInstance);
  router.use(webpackHotMiddleware(iframeCompiler));

  // custom middleware
  middlewareFn(router);

  const iframePromise = new Promise((res, rej) => {
    webpackDevMiddlewareInstance.waitUntilValid(stats => {
      const iframeTotalTime = process.hrtime(iframeStartTime);
      logger.trace({ message: 'iframe built', time: iframeTotalTime });

      if (stats.hasErrors()) {
        rej(stats);
      } else {
        res(stats);
      }
    });
  });

  Promise.all([managerPromise, iframePromise])
    .then(([managerStats, iframeStats]) => {
      router.get('/', (request, response) => {
        response.set('Content-Type', 'text/html');
        response.sendFile(path.join(`${__dirname}/public/index.html`));
      });
      router.get(/(.+\.js)$/, (request, response) => {
        response.set('Content-Type', 'text/javascript	');
        response.sendFile(path.join(`${__dirname}/public/${request.params[0]}`));
      });

      webpackResolve(iframeStats);
    })
    .catch(e => {
      console.log('catch', e);
      return webpackReject(e);
    });

  return router;
}
