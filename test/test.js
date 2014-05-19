var assert = require('chai').assert;
var fs     = require('fs');
var q      = require('q');
var _      = require('lodash');
var chalk  = require('chalk');
var uuid   = require('node-uuid');

q.longStackSupport = true;

var fixture = function (f) {
  return fs.readFileSync('./test/fixtures/' + f + '.js', { encoding: 'utf8' });
};

describe('Helpers', function () {
  var Helpers = require('../api/services/Helpers');

  describe('given a typical input of a block of code', function () {
    describe('undent', function () {
      it('should undent spaces (remove any extra indentions)', function () {
        assert.equal(Helpers.undent(fixture('undent-1tabs4spaces-before')), fixture('undent-0tabs4spaces-expected'), '[#undent: 4 Spaces]');
        assert.equal(Helpers.undent(fixture('undent-4tabs2spaces-before')), fixture('undent-0tabs2spaces-expected'), '[#undent: 2 Spaces]');
      });

      it('should undent tabs (remove any extra indentions) (and convert tabs to 4 spaces)', function () {
        assert.equal(Helpers.undent(fixture('undent-1tabs4tabs-before')), fixture('undent-0tabs4tabs-expected'), '[#undent: Tabs (4 spaces)]');
        assert.equal(Helpers.undent(fixture('undent-4tabs2tabs-before')), fixture('undent-0tabs2tabs-expected'), '[#undent: Tabs (2 spaces)]');
      });

      it('should not do anything to already undented code', function () {
        assert.equal(Helpers.undent(fixture('undent-0tabs4tabs-expected')),   fixture('undent-0tabs4tabs-expected'),   '[#undent: Tabs (4 spaces)]');
        assert.equal(Helpers.undent(fixture('undent-0tabs2tabs-expected')),   fixture('undent-0tabs2tabs-expected'),   '[#undent: Tabs (2 spaces)]');
        assert.equal(Helpers.undent(fixture('undent-0tabs4spaces-expected')), fixture('undent-0tabs4spaces-expected'), '[#undent: 4 Spaces]');
        assert.equal(Helpers.undent(fixture('undent-0tabs2spaces-expected')), fixture('undent-0tabs2spaces-expected'), '[#undent: 2 Spaces]');
      });
    });

    describe('guessTabSize', function () {
      it('should always return 4 for files with tabs', function () {
        assert.equal(Helpers.guessTabSize(fixture('undent-1tabs4tabs-before')),   4, '[#guessTabSize: Tabs (1)]');
        assert.equal(Helpers.guessTabSize(fixture('undent-0tabs4tabs-expected')), 4, '[#guessTabSize: Tabs (2)]');
        assert.equal(Helpers.guessTabSize(fixture('undent-4tabs2tabs-before')),   4, '[#guessTabSize: Tabs (3)]');
        assert.equal(Helpers.guessTabSize(fixture('undent-0tabs2tabs-expected')), 4, '[#guessTabSize: Tabs (4)]');
      });

      it('should return its best guess at tab length for files with spaces', function () {
        assert.equal(Helpers.guessTabSize(fixture('undent-1tabs4spaces-before')),   4, '[#guessTabSize: 4 Spaces (1)]');
        assert.equal(Helpers.guessTabSize(fixture('undent-0tabs4spaces-expected')), 4, '[#guessTabSize: 4 Spaces (2)]');
        assert.equal(Helpers.guessTabSize(fixture('undent-4tabs2spaces-before')),   2, '[#guessTabSize: 2 Spaces (1)]');
        assert.equal(Helpers.guessTabSize(fixture('undent-0tabs2spaces-expected')), 2, '[#guessTabSize: 2 Spaces (2)]');
      });

      it('should handle files with no spaces/tabs by returning the fallback default, which is 2', function () {
        assert.equal(Helpers.guessTabSize(fixture('one-liner')), 2, '[#guessTabSize: One Liner]');
      });
    });
  });
});

var Sails   = require('sails');
var Request = require('supertest');

// create a variable to hold the instantiated sails server
var sails, request;

// Global before hook
before(function(done) {
  // Lift sails and start the server
  console.log(chalk.cyan('Lifting Sails...'));
  // starting the server can sometimes take a little while
  this.timeout(10000);
  Sails.lift({
    log: {
      level: 'error'
    },
  }, function (err, app) {
    sails = app;
    console.log(chalk.cyan('Sails Lifted!'));
    done(err, sails);
  });
});

describe(chalk.blue('API') + ' -', function () {
  before(function () {
    request = Request('http://localhost:' + sails.config.port);
  });

  // describe('User Model', function () {
  //   beforeEach(function (done) {
  //     sails.models.user.create({
  //       name: 'Test User',
  //       username: 'TestUser',
  //       email: 'test@user.com',
  //     }).exec(done);
  //   });

  //   afterEach(function (done) {
  //     sails.models.user.destroy({ email: 'test@user.com' }).exec(done);
  //   });

  //   it('should be able to find users by email', function () {
  //     return sails.models.user.findOne({ email: 'test@user.com' }).then(function (user) {
  //       assert.equal(user.name, 'Test User');
  //     });
  //   });
  // });

  describe(chalk.yellow('Snippet Model') + ' -', function () {
    var testUser;
    before(function () {
      return sails.models.user.destroy({ email: 'test@user.com' }).then(function () {
        return sails.models.user.create({
          name: 'Test User',
          username: 'TestUser',
          email: 'test@user.com',
        });
      }).then(function (user) {
        testUser = user;
      });
    });

    after(function () {
      sails.models.user.destroy({ email: 'test@user.com' });
    });


    describe('access with an anonymous user', function () {
      // setup and teardown
      var testSnippet;
      before(function () {
        return sails.models.snippet.create({
          snippet: 'banana',
          user: testUser.id
        }).then(function (snippet) {
          testSnippet = snippet;
        });
      });

      after(function () {
        return sails.models.snippet.destroy({ id: testSnippet.id });
      });


      // setup and teardown
      afterEach(function () {
        return sails.models.snippet.findOneById(testSnippet.id).then(function (snippet) {
          assert.equal(snippet.snippet, 'banana');
        });
      });

      // on to the tests!
      it('should not allow anonymous users to retrieve all snippets', function (done) {
        request.get('/api/snippets/').expect(403).end(done);
      });

      it('should not allow anonymous users to create a snippet', function (done) {
        var clone = _.clone(testSnippet);
        delete clone.id;
        request.post('/api/snippets/').send(clone).expect(403).end(done);
      });

      it('should not allow anonymous users to update a snippet', function (done) {
        var clone = _.clone(testSnippet);
        clone.snippet = 'apple';
        request.put('/api/snippets/' + clone.id).send(clone).expect(403).end(done);
      });

      it('should not allow anonymous users to delete a snippet', function (done) {
        request.delete('/api/snippets/' + testSnippet.id).expect(403).end(done);
      });

      it('should allow anonymous users to retrieve a specific snippet', function (done) {
        request.get('/api/snippets/' + testSnippet.id).expect(200).end(done);
      });

      it('should have retrieval of a specific snippet come with no user data', function (done) {
        request.get('/api/snippets/' + testSnippet.id).expect(200).end(function (err, snippet) {
          assert.equal(snippet.user, undefined);
          done(err, snippet);
        });
      });
    }); // anonymous user

    describe('access with an API key', function () {
      // setup and teardown
      var snippet2Id = 'abc123e', isDeleted = false;

      var testSnippet;
      before(function () {
        return sails.models.snippet.create({
          snippet: 'banana',
          user: testUser.id
        }).then(function (snippet) {
          testSnippet = snippet;
        });
      });

      after(function () {
        return sails.models.snippet.destroy({ id: snippet2Id });
      });

      afterEach(function () {
        return sails.models.snippet.findOneById(testSnippet.id).then(function (snippet) {
          if (!isDeleted)
            assert.equal(snippet.snippet, 'banana');
          else
            assert.equal(snippet, undefined);
        });
      });

      // on to the tests!
      it('should allow an API key to create a snippet', function (done) {
        var clone = _.clone(testSnippet);
        clone.id = snippet2Id;
        clone.apiKey = testUser.apiKey;
        request.post('/api/snippets/').send(clone).expect(201).end(done);
      });

      it('should not allow an API key to update a snippet', function (done) {
        var clone = _.clone(testSnippet);
        clone.snippet = 'apple';
        clone.apiKey = testUser.apiKey;
        request.put('/api/snippets/' + clone.id).send(clone).expect(403).end(done);
      });

      it('should allow an API key to delete a snippet', function (done) {
        isDeleted = true;
        request.delete('/api/snippets/' + testSnippet.id).send({ apiKey: testUser.apiKey }).expect(200).end(done);
      });
    }); // API key

    describe('access with an authorized user', function () {
      // setup and teardown
      var isDeleted = false, isApple = false;

      var testSnippet;
      before(function () {
        return sails.models.snippet.create({
          snippet: 'banana',
          user: testUser.id
        }).then(function (snippet) {
          testSnippet = snippet;
        });
      });

      after(function () {
        return sails.models.snippet.destroy({ id: testSnippet.id });
      });

      afterEach(function () {
        return sails.models.snippet.findOneById(testSnippet.id).then(function (snippet) {
          if (!isDeleted)
            assert.equal(snippet.snippet, isApple ? 'apple' : 'banana');
          else
            assert.equal(snippet, undefined);
        });
      });

      it('should not allow an authorized user to create a snippet', function (done) {
        var clone = _.clone(testSnippet);
        delete clone.id;
        request.post('/api/snippets/').send(clone).expect(403).end(done);
      });

      it('should allow an authorized user to update a snippet', function (done) {
        var clone = _.clone(testSnippet);
        clone.snippet = 'apple';
        isApple = true;
        request.put('/api/snippets/' + clone.id).send({ mockUser: testUser, origBody: clone }).expect(200).end(done);
      });

      it('should not allow another authorized user to update your snippet', function (done) {
        var clone = _.clone(testSnippet);
        clone.snippet = 'apple';
        var userClone = _.clone(testUser);
        userClone.id = uuid.v4();
        request.put('/api/snippets/' + clone.id).send({ mockUser: userClone, origBody: clone }).expect(403).end(done);
      });

      it('should not allow an authorized user to delete a snippet', function (done) {
        // isDeleted = true;
        request.delete('/api/snippets/' + testSnippet.id).expect(403).end(done);
      });
    }); // authorized user
  }); // Snippet Model
}); // API

// Global after hook
after(function(done) {
  console.log(chalk.cyan('Lowering Sails...'));
  sails.lower(function (err) {
    console.log(chalk.cyan('Sails Lowered!'));
    done(err);
  });
});