#!/usr/bin/env node

var gittio = require('../lib/gittio'),
  config = require('../lib/config'),
  logger = require('../lib/logger'),
  program = require('commander'),
  fs = require('fs'),
  pkg = require('../package.json'),
  updateNotifier = require('update-notifier'),
  notifier = updateNotifier({
    pkg: pkg
  });

program
  .version(pkg.version, '-v, --version')
  .description(pkg.about.name)
  .usage('command <args> [options]')
  .option('-g, --global', 'use global path for modules')
  .option('-f, --force', 'install components even if already found')
  .option('-b, --alloy-base <directory>', 'select a different alloy base directory instead of app, e.g. src')
  .option('-p, --platform <platform>', 'apply to a specific platform only');

var install_cmd = program.command('install')
  .usage('<id>@<version-range>:<platform>')
  .description('install all missing modules and widgets')
  .option('-t, --type <type>', 'widget or module (default: both)')
  .action(install);

// ony here for help
program.command('install <id>')
  .description('install the latest version');

// ony here for help
program.command('install <id>@<version-range>')
  .description('install a specific version (range)');

// ony here for help
program.command('install <id>@<version-range>:<platform>')
  .description('install a specific version (range) for a specific platform');

// create alias command
var install_alias = program.command('i')
  .action(install)
  .description("shorthand for `install`");

// clone the options
install_alias.options = install_cmd.options;

program.command('update')
  .description('update all modules and widgets')
  .option('-t, --type <type>', 'widget or module (default: both)')
  .action(function(env) {
    notifier.notify();

    var params = {
      force: this.force,
      global: this.global,
      platform: this.platform,
      type: env.type,
      update: true,
      alloyBase: this.alloyBase
    };
    config.init(params, function() {
      return gittio.install(params);
    });
  });

var uninstall_cmd = program.command('uninstall <id>')
  .usage('<id>@<version>:<platform>')
  .description('uninstall a module or widget')
  .action(uninstall);

// ony here for help
program.command('uninstall <id>@<version>')
  .description('uninstall a specific version');

// ony here for help
program.command('uninstall <id>@<version>:<platform>')
  .description('uninstall a specific version for a specific platform');

// create alias command
var uninstall_alias = program.command('u')
  .action(uninstall)
  .description("shorthand for `uninstall`");

// clone the options
install_alias.options = install_cmd.options;

program.command('info <id>')
  .description('display info about a component')
  .option('-o, --output <output>', 'pretty or json (default: pretty)')
  .action(gittio.info);

program.command('demo <id>')
  .description('create a demo project using the module example app.js')
  .option('-p, --platform <platform>', 'define which platform(s) you\'d like to demo (comma separated')
  .action(demo);

program.command('config')
  .description('list all global configuration settings')
  .action(function(env) {

    // only run if there are no arguments
    if (this.args.length === 1) {

      require('../lib/config').list();

      // or commander will also run the other config command
      process.exit();

    }

  });

program.command('config <key> <value>')
  .description('set a global configuration setting')
  .action(function(env) {

    require('../lib/config').set(this.args[0], this.args[1]);

  });

program.parse(process.argv);

if (program.args.length === 0 || typeof program.args[program.args.length - 1] === 'string') {
  notifier.notify();

  program.help();
}

function argsToParams(args, params, url) {

  if (typeof args[0] === 'string') {
    var input = args[0];

    if (url && input.indexOf('://') > 0) {
      params.url = input;

    } else if (url && fs.existsSync(input)) {
      params.file = input;

    } else {

      var at = input.indexOf('@');
      var sc = input.indexOf(':');

      if (sc > 0) {
        params.platform = input.substr(sc + 1);
        input = input.substr(0, sc);
      }

      if (at > 0) {
        params.id = input.substr(0, at);
        params.version = input.substr(at + 1);

      } else {
        params.id = input;
      }
    }
  }
}

function install(env) {
  notifier.notify();

  var args = this.args;
  var params = {
    force: this.force,
    global: this.global,
    platform: this.platform,
    type: env.type,
    alloyBase: this.alloyBase
  };
  config.init(params, function() {
    argsToParams(args, params, true);

    if (params.id && params.version) {
      params.force = true;
    }

    return gittio.install(params);
  });
}

function uninstall(env) {
  notifier.notify();

  var args = this.args;
  var params = {
    force: this.force,
    global: this.global,
    platform: this.platform,
    alloyBase: this.alloyBase
  };
  config.init(params, function() {
    argsToParams(args, params);

    if (!params.id) {
      logger.error('missing <id>');
      return;
    }

    return gittio.uninstall(params);
  });
}

function demo(env) {
  notifier.notify();

  var args = this.args;
  var params = {
    platform: this.platform,
    global: true,
    alloyBase: this.alloyBase
  };
  config.init(params, function() {
    argsToParams(args, params);

    if (!params.id) {
      logger.error('missing <id>');
      return;
    }

    return gittio.demo(params);
  });
}