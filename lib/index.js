(function() {
  var cson, deepObjectExtend, extensions, fs, get_environment, inject_variables, load_config, load_files, path, yaml, _;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  yaml = require('js-yaml');

  cson = require('cson');

  extensions = {
    json: {
      parse: function(content) {
        return JSON.parse(content);
      }
    },
    yml: {
      parse: function(content) {
        return yaml.load(content);
      }
    },
    yaml: {
      parse: function(content) {
        return yaml.load(content);
      }
    },
    cson: {
      parse: function(content) {
        return cson.parseSync(content);
      }
    }
  };

  deepObjectExtend = function(target, source) {
    var prop;
    prop = void 0;
    for (prop in source) {
      if (typeof target[prop] === "object" && typeof source[prop] === "object" && prop in target) {
        deepObjectExtend(target[prop], source[prop]);
      } else {
        target[prop] = source[prop];
      }
    }
    return target;
  };

  load_config = function(opts) {
    var configs, dir;
    configs = {};
    dir = path.resolve(process.cwd(), opts.path);
    load_files(dir).forEach(function(file) {
      var config;
      config = extensions[file.extension].parse(file.content);
      return configs[file.name] = get_environment(config);
    });
    return configs;
  };

  get_environment = function(config) {
    var env, env_config, env_default;
    env = process.env.NODE_ENV || 'development';
    env_default = config["default"] || {};
    env_config = config[env] || {};
    return deepObjectExtend(env_default, env_config);
  };

  inject_variables = function(file) {
    return file.replace(/#\{(.+)\}/g, function(match, code) {
      var base, variable, _i, _len;
      code = code.split('.');
      base = new Function("return " + code[0])();
      code.shift();
      for (_i = 0, _len = code.length; _i < _len; _i++) {
        variable = code[_i];
        base = base[variable];
      }
      if (base == null) {
        base = null;
      }
      return base;
    });
  };

  load_files = function(path) {
    var regex;
    regex = new RegExp("\\.(" + (Object.keys(extensions).join('|')) + ")$", 'i');
    return (fs.readdirSync(path).filter(function(file) {
      return regex.test(file);
    })).map(function(file) {
      var extension, name, __, _ref;
      _ref = /^(.+)\.+(.+)$/.exec(file), __ = _ref[0], name = _ref[1], extension = _ref[2];
      return {
        name: name.toLowerCase().replace(/\./g, '_'),
        extension: extension.toLowerCase(),
        content: inject_variables(fs.readFileSync("" + path + "/" + file, 'utf-8'))
      };
    });
  };

  module.exports = function(opts) {
    var options;
    if (opts == null) {
      opts = {};
    }
    options = {
      path: './config'
    };
    opts = _.defaults(opts, options);
    return load_config(opts);
  };

}).call(this);
