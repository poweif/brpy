module.exports = function(grunt) {
  // The server will run a max of 60 minutes;
  var SERVER_TIMEOUT = 1000 * 60 * 60;
  var SERVER_PORT = process.env.CTC_TEST_PORT > 1000 ?
      process.env.CTC_TEST_PORT : 9023;

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: SERVER_PORT,
          base: '.',
          keepalive: false
        }
      }
    }
  });

  // Plugin and grunt tasks.
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('serve', ['connect']);
  grunt.registerTask('default', []);
  grunt.registerTask('serve2', 'Start', function() {
    var done = this.async();
    grunt.log.writeln('---- Running server on http://dev.svca.cc:' +
        SERVER_PORT + ' for ' +  SERVER_TIMEOUT / (1000 * 60.) + ' minutes ----');
    grunt.log.writeln('---- Control + c to quit ----');
    setTimeout(function() {
        grunt.log.writeln('---- Server done! ----');
        done();
      }, SERVER_TIMEOUT);
  });
  grunt.registerTask('default', ['serve', 'serve2']);
};
