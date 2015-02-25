var path = require('path');
var _ = require('underscore');
var fs = require('fs');

// --css=css|scss|less
// --js=js|coffee|next.js
// --html=html|jade
// --skip-template-css=true|false
// --skip-template-js=true|false
// --skip-template-html=true|false
// --skip-iron-router
Command.create({
  name: 'init',
  usage: 'iron init',
  description: 'Initialize your project structure.'
}, function (args, opts) {
  // the app name is either the first argument to the
  // generator or inferred from the current directory.
  // if no appname is provided, we assume we're already
  // in the project directory.
  var appName = args[0] || path.basename(process.cwd());
  var projectDirectory = args[0] || process.cwd();

  var config = {
    engines: {
      html: opts.html || 'html',
      js: opts.js || 'js',
      css: opts.css || 'css'
    },

    template: {
      html: !_.has(opts, 'skip-template-html'),
      js: !_.has(opts, 'skip-template-js'),
      css: !_.has(opts, 'skip-template-css')
    }
  };

  var context = {
    app: appName,
    config: config
  };

  // the master config is stored in the current users home dir, e.g. ~/.iron/
  // it is used only when creating (or init) new iron projects, i.e. it is NOT
  // configuring the default behavior of the iron command-line tool (or well,
  // it's actually configuring the behaviour of 'create' and 'init'), but it's
  // configuring the config of new iron projects, which config in turn manage
  // the default behaviors of the iron tool
  var masterConfig = {
    packages: {
      add: ['audit-argument-checks', 'browser-policy', 'force-ssl'],
      remove: ['autopublish', 'insecure']
    }
  };

  // create a default master config file for the user if it does not exist
  var masterConfigFilePath = process.env.HOME + '/.iron/config.json';
  if (! this.isFile(masterConfigFilePath)) {
    this.createFile(masterConfigFilePath, JSON.stringify(masterConfig, null, 2) + '\n');
  }

  if (!this.isFile(masterConfigFilePath)) {
    throw new Error(".iron/config.json doesn't exist");
  }

  // read the default master config file
  var json = fs.readFileSync(masterConfigFilePath, 'utf8');
  try {
    masterConfig = JSON.parse(json);
  } catch(e) {
    if (e instanceof SyntaxError) {
      throw new Error("Error parsing .iron/config.json: " + e.message)
    } else {
      throw e;
    }
  }

  // how do we get the initial config class if I haven't
  // written config.json yet? Make a global dynamic variable
  // that gets set by the generator
  // CurrentConfig.get();
  // CurrentConfig.withValue({}, function() {
  // });

  var self = this;

  return CurrentConfig.withValue(config, function () {
    // copy the project template directory to the project directory
    self.copyTemplateDirectory('project', projectDirectory, context);

    // create an empty meteor project in the app folder
    self.createEmptyMeteorProject('app', {cwd: projectDirectory});

    var appDirectory = path.join(projectDirectory, 'app');

    // copy the meteor app folder template to our new app
    self.copyTemplateDirectory('app', appDirectory, context);

    // invoke the right generators for some default files
    Iron.findGenerator('template').invoke(['home'], {cwd: projectDirectory});
    Iron.findGenerator('stylesheet').invoke(['main'], {cwd: projectDirectory});

    if (!_.has(opts, 'skip-iron-router')) {
      // install the iron router package
      self.installMeteorPackage('iron:router', {cwd: appDirectory});
    }

    // Add packages configured to be added in the master config file
    for (var i = 0; i < masterConfig.packages.add.length; i++) {
      self.installMeteorPackage(masterConfig.packages.add[i], {cwd: appDirectory});
    }

    // Remove packages configured to be removed in the master config file
    for (var i = 0; i < masterConfig.packages.remove.length; i++) {
      self.removeMeteorPackage(masterConfig.packages.remove[i], {cwd: appDirectory});
    }

    return true;
  });
});
