Generator.create({
  name: 'controller',
  aliases: ['c'],
  usage: 'iron {generate, g}:{controller, v} [path/]<name> [--where]',
  description: 'Generate scaffolding for a RouteController.',
  examples: [
    'iron g:controller todos/todos_index --where "server"'
  ]
}, function (args, opts) {

  var config = CurrentConfig.get();

  var context = {
    name: this.classCase(opts.resourceName),
    where: opts.where,
    comments: config.generator && config.generator.comments === 'true',
  };

  this.template(
    'controller/controller.js',
    this.pathFromApp(opts.appPathPrefix, 'controllers', opts.dir, this.fileCase(opts.resourceName) + '_controller.js'),
    context
  );
});
